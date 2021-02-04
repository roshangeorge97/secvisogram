import React from 'react'
import DocObject from '../DocObject'
import DocObjectArray from '../DocObjectArray'
import EnumAttribute from '../EnumAttribute'
import TextAreaAttribute from '../TextAreaAttribute'
import TextAttribute from '../TextAttribute'

/**
 * @param {{
 *  label: string
 *  description: string
 *  validationErrors: import('../../../../../shared/validationTypes').ValidationError[]
 *  dataPath: string
 *  value?: Array<{
 *  }>
 *  onUpdate({}): void
 * }} props
 */
export default function Notes({
  label,
  description,
  validationErrors,
  dataPath,
  value: notes,
  onUpdate,
}) {
  return (
    <DocObject
      label={label}
      description={description}
      validationErrors={validationErrors}
      dataPath={dataPath}
      object={notes}
      defaultValue={() => [
        {
          type: '',
          text: '',
        },
      ]}
      onUpdate={onUpdate}
    >
      {notes ? (
        <DocObjectArray
          array={notes}
          itemLabel="Note"
          itemDescription="Is a place to put all manner of text blobs related to the current context."
          dataPath={dataPath}
          validationErrors={validationErrors}
          defaultValue={() => [
            {
              type: '',
              text: '',
            },
          ]}
          onDocUpdate={onUpdate}
        >
          {({ value, index }) => (
            <>
              <TextAttribute
                label="Title of note"
                description="Provides a concise description of what is contained in the text of the note."
                placeholder="Details"
                deletable
                validationErrors={validationErrors}
                dataPath={`${dataPath}/${index}/title`}
                value={value.title}
                onUpdate={onUpdate}
              />
              <EnumAttribute
                label="Note type"
                description="Choice of what kind of note this is."
                options={[
                  'description',
                  'details',
                  'faq',
                  'general',
                  'legal_disclaimer',
                  'other',
                  'summary',
                ]}
                validationErrors={validationErrors}
                dataPath={`${dataPath}/${index}/type`}
                value={value.type}
                onUpdate={onUpdate}
              />
              <TextAreaAttribute
                label="Note contents"
                description="The contents of the note. Content varies depending on type."
                validationErrors={validationErrors}
                dataPath={`${dataPath}/${index}/text`}
                value={value.text}
                onUpdate={onUpdate}
              />
            </>
          )}
        </DocObjectArray>
      ) : null}
    </DocObject>
  )
}