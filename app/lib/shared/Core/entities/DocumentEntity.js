import { parse } from 'json-pointer'
import unset from 'lodash/fp/unset'
import isEmpty from 'lodash/isEmpty'
import cwec from '../cwec_4.3.json'
import icann from './DocumentEntity/subtags.json'

/**
 * This class abstracts central logic regarding the json-document used
 * multiple times within the `Core`.
 */
export default class DocumentEntity {
  /**
   * @param {{ schemaValidator: import('ajv').ValidateFunction<unknown>}} params
   */
  constructor({ schemaValidator }) {
    /** @private */
    this.schemaValidator = schemaValidator
  }

  /**
   * This method validates the given document and returns a result object.
   *
   * @param {{ document: {} }} params
   */
  validate({ document }) {
    return this.validateDoc(document)
  }

  /**
   * This method encapsulates the strip-algorithm to generate either a valid or
   * an empty document.
   *
   * @param {{ document: {} }} params
   */
  strip({ document }) {
    /** @type {Array<{ dataPath: string; message: string; error: boolean }>} */
    const strippedPaths = []

    /**
     * @param {{}} doc
     * @param {string} dataPath
     * @returns {{}}
     */
    const deleteEmptyNodes = (doc, dataPath) => {
      if (typeof doc === 'string' || typeof doc === 'number') return doc
      if (Array.isArray(doc))
        return doc.map((item, i) => deleteEmptyNodes(item, `${dataPath}/${i}`))
      return {
        ...Object.fromEntries(
          Object.entries(doc)
            .filter(([key, value]) => {
              const valueIsEmpty =
                value === '' ||
                value === null ||
                (typeof value === 'object' && isEmpty(value))

              if (valueIsEmpty) {
                strippedPaths.push({
                  dataPath: `${dataPath}/${key}`,
                  message: 'value was empty',
                  error: false,
                })
              }
              return !valueIsEmpty
            })
            .map(([key, value]) => [
              key,
              deleteEmptyNodes(value, `${dataPath}/${key}`),
            ])
        ),
      }
    }

    const documentWithoutEmptyNodes = deleteEmptyNodes(document, '')
    let errorStrippedDocument = documentWithoutEmptyNodes
    /**
     * @type {Array<{
     *    message?: string
     *    dataPath: string
     *  }>}
     */
    let errors
    do {
      errors = this.validateDoc(errorStrippedDocument).errors
      errorStrippedDocument = JSON.parse(
        JSON.stringify(
          errors.reduce((updatedDoc, error) => {
            strippedPaths.push({
              dataPath: error.dataPath,
              error: true,
              message: /** @type {string} */ (error.message),
            })
            const parsedDataPath = parse(error.dataPath).join('.')
            if (parsedDataPath === '') return {}
            return unset(parsedDataPath, updatedDoc)
          }, errorStrippedDocument),
          (_, value) => {
            if (Array.isArray(value)) {
              return value.filter((e) => e !== undefined)
            }
            return value
          }
        )
      )
    } while (
      errors &&
      errors.length &&
      Object.keys(errorStrippedDocument).length > 0
    )
    return { document: errorStrippedDocument, strippedPaths }
  }

  /**
   * @param {unknown} doc
   * @private
   */
  validateDoc(doc) {
    let isValid = this.schemaValidator(doc)
    /**
     * @type {Array<{
     *    message?: string
     *    dataPath: string
     *  }>}
     */
    const errors = this.schemaValidator.errors ?? []
    if (hasLangField(doc)) {
      if (!icann.subtags.find((s) => s.subtag === doc.document.lang)) {
        isValid = false
        errors.push({
          message: 'is not a valid language-tag',
          dataPath: '/document/lang',
        })
      }
    }
    if (hasSourceLangField(doc)) {
      if (!icann.subtags.find((s) => s.subtag === doc.document.source_lang)) {
        isValid = false
        errors.push({
          message: 'is not a valid language-tag',
          dataPath: '/document/source_lang',
        })
      }
    }
    if (hasVulnerabilities(doc)) {
      for (let i = 0; i < doc.vulnerabilities.length; ++i) {
        const vulnerability = doc.vulnerabilities[i]
        if (vulnerabilityHasCWEFields(vulnerability)) {
          const entry = cwec.weaknesses.find(
            (w) => w.id === vulnerability.cwe.id
          )
          if (!entry) {
            isValid = false
            errors.push({
              dataPath: `/vulnerabilities/${i}/cwe/id`,
              message: 'no weakness with this id is recognized',
            })
            continue
          }
          if (entry.name !== vulnerability.cwe.name) {
            isValid = false
            errors.push({
              dataPath: `/vulnerabilities/${i}/cwe/name`,
              message: 'the name does not match the weakness with the given id',
            })
            continue
          }
        }
      }
    }
    return {
      isValid,
      errors: errors,
    }
  }
}

/**
 * @param {any} doc
 * @returns {doc is { document: { lang: string } }}
 */
const hasLangField = (doc) =>
  doc && doc.document && typeof doc.document.lang === 'string' ? true : false

/**
 * @param {any} doc
 * @returns {doc is { document: { source_lang: string } }}
 */
const hasSourceLangField = (doc) =>
  doc && doc.document && typeof doc.document.source_lang === 'string'
    ? true
    : false

/**
 * @param {any} doc
 * @returns {doc is { vulnerabilities: Array<unknown> }}
 */
const hasVulnerabilities = (doc) =>
  doc && Array.isArray(doc.vulnerabilities) ? true : false

/**
 * @param {any} vulnerability
 * @returns {vulnerability is { cwe: { id: string; name: string } }}
 */
const vulnerabilityHasCWEFields = (vulnerability) =>
  vulnerability &&
  vulnerability.cwe &&
  typeof vulnerability.cwe.id === 'string' &&
  typeof vulnerability.cwe.name === 'string'
    ? true
    : false
