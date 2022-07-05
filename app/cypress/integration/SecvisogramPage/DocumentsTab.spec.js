import { getLoginEnabledConfig } from '../../fixtures/appConfigData.js'
import {
  getAdvisories,
  getAdvisory,
  getGetAdvisoriesResponse,
  getGetAdvisoryDetailResponse,
  getUserInfo,
  getUsers,
} from '../../fixtures/cmsBackendData.js'

describe('SecvisogramPage / DocumentsTab', function () {
  beforeEach(function () {
    cy.intercept(
      '/.well-known/appspecific/de.bsi.secvisogram.json',
      getLoginEnabledConfig()
    ).as('wellKnownAppConfig')
    cy.intercept('/api/2.0/advisories/', getGetAdvisoriesResponse()).as(
      'apiGetAdvisories'
    )
  })

  describe('can fetch documents from the csaf cms backend', function () {
    for (const user of getUsers()) {
      it(`user: ${user.preferredUsername}`, function () {
        cy.intercept(getLoginEnabledConfig().userInfoUrl, getUserInfo(user)).as(
          'apiGetUserInfo'
        )

        cy.visit('?tab=DOCUMENTS')

        cy.wait('@wellKnownAppConfig')
        cy.wait('@apiGetUserInfo')
        for (const advisory of getGetAdvisoriesResponse()) {
          cy.get(
            `[data-testid="advisory-${advisory.advisoryId}-list_entry"]`
          ).should('exist')
          cy.get(
            `[data-testid="advisory-${advisory.advisoryId}-list_entry-workflow_state"]`
          ).should('have.text', advisory.workflowState)
        }
      })
    }
  })

  describe('can delete documents', function () {
    for (const user of getUsers()) {
      for (const advisory of getGetAdvisoriesResponse()) {
        it(`user: ${user.preferredUsername}, advisoryId: ${advisory.advisoryId}`, function () {
          cy.intercept(
            getLoginEnabledConfig().userInfoUrl,
            getUserInfo(user)
          ).as('apiGetUserInfo')
          const advisoryDetail = getGetAdvisoryDetailResponse({
            advisory: getAdvisory({ advisoryId: advisory.advisoryId }),
          })
          cy.intercept(
            {
              method: 'DELETE',
              url: `/api/2.0/advisories/${advisory.advisoryId}/?revision=${advisoryDetail.revision}`,
            },
            { statusCode: 204 }
          ).as('apiDeleteAdvisory')
          cy.intercept(
            `/api/2.0/advisories/${advisory.advisoryId}/`,
            advisoryDetail
          ).as('apiGetAdvisoryDetail')

          cy.visit('?tab=DOCUMENTS')
          cy.wait('@wellKnownAppConfig')
          cy.wait('@apiGetUserInfo')
          cy.wait('@apiGetAdvisories')

          // Pretend to have the advisory removed
          cy.intercept(
            '/api/2.0/advisories/',
            getGetAdvisoriesResponse().filter(
              (a) => a.advisoryId !== advisory.advisoryId
            )
          ).as('apiGetAdvisories')

          cy.get(
            `[data-testid="advisory-${advisory.advisoryId}-list_entry-delete_button"]`
          ).click()
          cy.get('[data-testid="alert-confirm_button"]').click()
          cy.wait([
            '@apiGetAdvisoryDetail',
            '@apiDeleteAdvisory',
            '@apiGetAdvisories',
          ])
          cy.get('[data-testid="loading_indicator"]').should('not.exist')
          cy.get(
            `[data-testid="advisory-${advisory.advisoryId}-list_entry"]`
          ).should('not.exist')
        })
      }
    }
  })

  describe('can open documents', function () {
    for (const user of getUsers()) {
      for (const advisory of getGetAdvisoriesResponse()) {
        it(`user: ${user.preferredUsername}, advisoryId: ${advisory.advisoryId}`, function () {
          cy.intercept(
            getLoginEnabledConfig().userInfoUrl,
            getUserInfo(user)
          ).as('apiGetUserInfo')
          const advisoryDetail = getGetAdvisoryDetailResponse({
            advisory: getAdvisory({ advisoryId: advisory.advisoryId }),
          })
          cy.intercept(
            `/api/2.0/advisories/${advisory.advisoryId}/`,
            advisoryDetail
          ).as('apiGetAdvisoryDetail')

          cy.visit('?tab=DOCUMENTS')
          cy.wait('@wellKnownAppConfig')
          cy.wait('@apiGetUserInfo')
          cy.wait('@apiGetAdvisories')

          cy.get(
            `[data-testid="advisory-${advisory.advisoryId}-list_entry-open_button"]`
          ).click()
          cy.wait('@apiGetAdvisoryDetail')
          cy.get('[data-testid="loading_indicator"]').should('not.exist')
          cy.location('search').should('equal', '?tab=EDITOR')
          cy.get('[data-testid="attribute-/document/title"] input').should(
            'have.value',
            /** @type {any} */ (advisoryDetail.csaf).document.title
          )
          cy.get('[data-testid="document_tracking_id"]').should(
            'have.text',
            /** @type {any} */ (advisoryDetail.csaf).document.title
          )
        })
      }
    }
  })

  describe('can move a document into a new workflow state', function () {
    for (const user of getUsers()) {
      for (const advisory of getAdvisories()) {
        for (const workflowState of advisory.allowedStateChanges) {
          it(`user: ${user.preferredUsername}, advisoryId: ${advisory.advisoryId}, workflowState: ${workflowState}`, function () {
            cy.intercept(
              getLoginEnabledConfig().userInfoUrl,
              getUserInfo(user)
            ).as('apiGetUserInfo')
            cy.intercept(
              `/api/2.0/advisories/${advisory.advisoryId}/`,
              getGetAdvisoryDetailResponse({
                advisory,
              })
            ).as('apiGetAdvisoryDetail')

            cy.visit('?tab=DOCUMENTS')
            cy.wait('@wellKnownAppConfig')
            cy.wait('@apiGetUserInfo')
            cy.wait('@apiGetAdvisories')

            const httpPathSegments = /** @type {const} */ ({
              Review: 'Review',
              Approved: 'Approve',
              Published: 'Publish',
              Draft: 'Draft',
              RfPublication: 'RfPublication',
            })
            const documentTrackingStatus = 'Final'
            const proposedTime = '2017-06-01T08:30'
            const apiChangeWorkflowStateURL = new URL(
              `/api/2.0/advisories/${advisory.advisoryId}/workflowstate/${httpPathSegments[workflowState]}`,
              window.location.href
            )
            apiChangeWorkflowStateURL.searchParams.set(
              'revision',
              advisory.revision
            )
            if (workflowState === 'Published') {
              apiChangeWorkflowStateURL.searchParams.set(
                'documentTrackingStatus',
                documentTrackingStatus
              )
            }
            if (
              workflowState === 'Published' ||
              workflowState === 'RfPublication'
            ) {
              apiChangeWorkflowStateURL.searchParams.set(
                'proposedTime',
                new Date(proposedTime).toISOString()
              )
            }
            cy.intercept(
              'PATCH',
              apiChangeWorkflowStateURL.pathname +
                apiChangeWorkflowStateURL.search,
              {}
            ).as('apiChangeWorkflowState')

            cy.get(
              `[data-testid="advisory-${advisory.advisoryId}-list_entry-edit_workflow_state_button"]`
            ).click()
            cy.get(
              `select[data-testid="advisory-${advisory.advisoryId}-list_entry-workflow_state_select"]`
            ).select(workflowState)
            if (workflowState === 'Published') {
              for (const trackingStatus of ['Final', 'Interim']) {
                cy.get(
                  `select[data-testid="advisory-${advisory.advisoryId}-edit_workflow_state_dialog-tracking_status_select"] option[value="${trackingStatus}"]`
                ).should('exist')
              }
              cy.get(
                `select[data-testid="advisory-${advisory.advisoryId}-edit_workflow_state_dialog-tracking_status_select"]`
              ).select(documentTrackingStatus)
            }
            if (
              workflowState === 'Published' ||
              workflowState === 'RfPublication'
            ) {
              cy.get(
                `[data-testid="advisory-${advisory.advisoryId}-edit_workflow_state_dialog-proposed_time_input"]`
              ).type(proposedTime)
            }
            cy.get(
              `select[data-testid="advisory-${advisory.advisoryId}-list_entry-workflow_state_select"]`
            )
              .closest('form')
              .submit()
            cy.wait('@apiChangeWorkflowState')
            cy.wait('@apiGetAdvisories')
          })
        }
      }
    }
  })
})