import {
  faCheckCircle,
  faCog,
  faExclamationTriangle,
  faFile,
  faFileAlt,
  faFolderOpen,
  faWindowClose,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useAlert } from './shared/Alert.js'
import useDebounce from './shared/useDebounce.js'
import MonacoEditor from 'react-monaco-editor'

/**
 * @param {{
    formValues: import('../shared/types').FormValues;
    validationErrors: import('../shared/types').ValidationError[];
    strict: boolean;
    onSetStrict(strict: boolean): void;
    onChange(doc: {} | null): void;
    onOpen(file: File): Promise<void | {}>;
    onDownload(doc: {}): void;
    onNewDocMin(): Promise<void | {}>;
    onNewDocMax(): Promise<void | {}>;
    onLockTab(): void;
    onUnlockTab(): void;
}} props
 * @this {any}
 */
export default function JsonEditorTab({
  formValues,
  validationErrors: errors,
  strict,
  onSetStrict,
  onChange,
  onOpen,
  onNewDocMin,
  onNewDocMax,
  onLockTab,
  onUnlockTab,
}) {
  const { doc } = formValues

  const [editor, setEditor] = React.useState(
    /** @type {monacoEditor.editor} */ {}
  )
  const [monacoState, setMonaco] = React.useState(/** @type {monaco} */ {})

  const stringifiedDoc = React.useMemo(
    () => JSON.stringify(doc, null, 2),
    [doc]
  )

  /**
   * The initial value of the state used to prevent a re-render of the ace editor
   * when the document changes from outside.
   */
  // const [initialValue] = React.useState(stringifiedDoc)

  /**
   * Holds the value and potential parse errors of the ace editor input.
   */
  const [{ value, parseError }, setState] = React.useState({
    value: stringifiedDoc,
    parseError: null,
  })
  const [showExpertSettings, setShowExpertSettings] = React.useState(!strict)
  const [showErrors, setShowErrors] = React.useState(false)
  const debouncedValue = useDebounce(value)

  /**
   * Toggles between strict and lenient validation.
   */
  const toggleStrict = () => {
    onSetStrict(!strict)
  }

  const toggleExpertSettings = () => {
    setShowExpertSettings(!showExpertSettings)
  }

  const toggleShowErrors = () => {
    setShowErrors(!showErrors)
  }

  const confirmMin = () => {
    onNewDocMin().then((newDoc) => {
      editor.getModel().setValue(JSON.stringify(newDoc, null, 2))
    })
    hideMin()
  }

  const confirmMax = () => {
    onNewDocMax().then((newDoc) => {
      editor.getModel().setValue(JSON.stringify(newDoc, null, 2))
    })
    hideMax()
  }

  const handleOpen = (/** @type {File} */ file) => {
    onOpen(file).then((openedDoc) => {
      editor.getModel().setValue(JSON.stringify(openedDoc, null, 2))
    })
  }

  /**
   * Locks the tab navigation if there are any parse errors.
   */
  React.useEffect(() => {
    if (parseError) onLockTab()
    else onUnlockTab()
  }, [parseError, onLockTab, onUnlockTab])

  /**
   * Parses the ace editor input and replaces the document.
   */
  React.useEffect(() => {
    /** @type {{} | null} */
    let result = null
    try {
      result = JSON.parse(debouncedValue)
      setState((state) => ({ ...state, parseError: null }))
    } catch (/** @type {any} */ e) {
      setState((state) => ({ ...state, parseError: e }))
      return
    }
    onChange(result)
  }, [debouncedValue, onChange])

  React.useEffect(() => {
    if (errors.length === 0) {
      setShowErrors(false)
    }
  }, [errors])

  const {
    show: showMin,
    hide: hideMin,
    Alert: MinAlert,
  } = useAlert({
    description:
      'This will create a new CSAF document. All current content will be lost. Are you sure?',
    confirmLabel: 'Yes, create new document',
    cancelLabel: 'No, resume editing',
    confirm: confirmMin,
  })

  const {
    show: showMax,
    hide: hideMax,
    Alert: MaxAlert,
  } = useAlert({
    description:
      'This will create a new CSAF document. All current content will be lost. Are you sure?',
    confirmLabel: 'Yes, create new document',
    cancelLabel: 'No, resume editing',
    confirm: confirmMax,
  })

  const [code] = React.useState(stringifiedDoc)

  const editorDidMount = (
    /** @type {any } */ editor,
    /** @type {any} */ monaco
  ) => {
    console.log('editorDidMount', editor)
    setEditor(editor)
    setMonaco(monaco)
  }

  const editorWillMount = () => {}

  // monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  //   validate: true,
  //   schemas: [
  //     {
  //       uri: 'http://myserver/foo-schema.json',
  //       fileMatch: ['*'],
  //       schema: {
  //         title: 'Common Security Advisory Framework',
  //         description:
  //           'Representation of security advisory information as a JSON document.',
  //         type: 'object',
  //         $defs: {
  //           acknowledgments_t: {
  //             title: 'List of acknowledgments',
  //             description: 'Contains a list of acknowledgment elements.',
  //             type: 'array',
  //             minItems: 1,
  //             items: {
  //               title: 'Acknowledgment',
  //               description:
  //                 'Acknowledges contributions by describing those that contributed.',
  //               type: 'object',
  //               minProperties: 1,
  //               properties: {
  //                 names: {
  //                   title: 'List of acknowledged names',
  //                   description:
  //                     'Contains the names of entities being recognized.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   items: {
  //                     title: 'Name of entity being recognized',
  //                     description: 'Contains the name of a single person.',
  //                     type: 'string',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                 },
  //                 organization: {
  //                   title: 'Contributing organization',
  //                   description:
  //                     'Contains the name of a contributing organization being recognized.',
  //                   type: 'string',
  //                   minLength: 1,
  //                   examples: [],
  //                 },
  //                 summary: {
  //                   title: 'Summary of the acknowledgment',
  //                   description:
  //                     'SHOULD represent any contextual details the document producers wish to make known about the acknowledgment or acknowledged parties.',
  //                   type: 'string',
  //                   minLength: 1,
  //                   examples: [],
  //                 },
  //                 urls: {
  //                   title: 'List of URLs',
  //                   description:
  //                     'Specifies a list of URLs or location of the reference to be acknowledged.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   items: {
  //                     title: 'URL of acknowledgment',
  //                     description:
  //                       'Contains the URL or location of the reference to be acknowledged.',
  //                     type: 'string',
  //                     format: 'uri',
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           branches_t: {
  //             title: 'List of branches',
  //             description:
  //               'Contains branch elements as children of the current element.',
  //             type: 'array',
  //             minItems: 1,
  //             items: {
  //               title: 'Branch',
  //               description:
  //                 'Is a part of the hierarchical structure of the product tree.',
  //               type: 'object',
  //               maxProperties: 3,
  //               minProperties: 3,
  //               required: ['category', 'name'],
  //               properties: {
  //                 branches: {
  //                   $ref: '#/$defs/branches_t',
  //                 },
  //                 category: {
  //                   title: 'Category of the branch',
  //                   description:
  //                     'Describes the characteristics of the labeled branch.',
  //                   type: 'string',
  //                   enum: [
  //                     'architecture',
  //                     'host_name',
  //                     'language',
  //                     'legacy',
  //                     'patch_level',
  //                     'product_family',
  //                     'product_name',
  //                     'product_version',
  //                     'product_version_range',
  //                     'service_pack',
  //                     'specification',
  //                     'vendor',
  //                   ],
  //                 },
  //                 name: {
  //                   title: 'Name of the branch',
  //                   description:
  //                     "Contains the canonical descriptor or 'friendly name' of the branch.",
  //                   type: 'string',
  //                   minLength: 1,
  //                   examples: [],
  //                 },
  //                 product: {
  //                   $ref: '#/$defs/full_product_name_t',
  //                 },
  //               },
  //             },
  //           },
  //           full_product_name_t: {
  //             title: 'Full product name',
  //             description:
  //               'Specifies information about the product and assigns the product_id.',
  //             type: 'object',
  //             required: ['name', 'product_id'],
  //             properties: {
  //               name: {
  //                 title: 'Textual description of the product',
  //                 description:
  //                   'The value should be the product’s full canonical name, including version number and other attributes, as it would be used in a human-friendly document.',
  //                 type: 'string',
  //                 minLength: 1,
  //                 examples: [],
  //               },
  //               product_id: {
  //                 $ref: '#/$defs/product_id_t',
  //               },
  //               product_identification_helper: {
  //                 title: 'Helper to identify the product',
  //                 description:
  //                   'Provides at least one method which aids in identifying the product in an asset database.',
  //                 type: 'object',
  //                 minProperties: 1,
  //                 properties: {
  //                   cpe: {
  //                     title: 'Common Platform Enumeration representation',
  //                     description:
  //                       'The Common Platform Enumeration (CPE) attribute refers to a method for naming platforms external to this specification.',
  //                     type: 'string',
  //                     pattern:
  //                       '^(cpe:2\\.3:[aho\\*\\-](:(((\\?*|\\*?)([a-zA-Z0-9\\-\\._]|(\\\\[\\\\\\*\\?!"#\\$%&\'\\(\\)\\+,/:;<=>@\\[\\]\\^`\\{\\|\\}~]))+(\\?*|\\*?))|[\\*\\-])){5}(:(([a-zA-Z]{2,3}(-([a-zA-Z]{2}|[0-9]{3}))?)|[\\*\\-]))(:(((\\?*|\\*?)([a-zA-Z0-9\\-\\._]|(\\\\[\\\\\\*\\?!"#\\$%&\'\\(\\)\\+,/:;<=>@\\[\\]\\^`\\{\\|\\}~]))+(\\?*|\\*?))|[\\*\\-])){4})|([c][pP][eE]:/[AHOaho]?(:[A-Za-z0-9\\._\\-~%]*){0,6})$',
  //                     minLength: 5,
  //                   },
  //                   hashes: {
  //                     title: 'List of hashes',
  //                     description:
  //                       'Contains a list of cryptographic hashes usable to identify files.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     items: {
  //                       title: 'Cryptographic hashes',
  //                       description:
  //                         'Contains all information to identify a file based on its cryptographic hash values.',
  //                       type: 'object',
  //                       required: ['file_hashes', 'filename'],
  //                       properties: {
  //                         file_hashes: {
  //                           title: 'List of file hashes',
  //                           description:
  //                             'Contains a list of cryptographic hashes for this file.',
  //                           type: 'array',
  //                           minItems: 1,
  //                           items: {
  //                             title: 'File hash',
  //                             description:
  //                               'Contains one hash value and algorithm of the file to be identified.',
  //                             type: 'object',
  //                             required: ['algorithm', 'value'],
  //                             properties: {
  //                               algorithm: {
  //                                 title: 'Algorithm of the cryptographic hash',
  //                                 description:
  //                                   'Contains the name of the cryptographic hash algorithm used to calculate the value.',
  //                                 type: 'string',
  //                                 default: 'sha256',
  //                                 minLength: 1,
  //                                 examples: [],
  //                               },
  //                               value: {
  //                                 title: 'Value of the cryptographic hash',
  //                                 description:
  //                                   'Contains the cryptographic hash value in hexadecimal representation.',
  //                                 type: 'string',
  //                                 pattern: '^[0-9a-fA-F]{32,}$',
  //                                 minLength: 32,
  //                                 examples: [],
  //                               },
  //                             },
  //                           },
  //                         },
  //                         filename: {
  //                           title: 'Filename',
  //                           description:
  //                             'Contains the name of the file which is identified by the hash values.',
  //                           type: 'string',
  //                           minLength: 1,
  //                           examples: [],
  //                         },
  //                       },
  //                     },
  //                   },
  //                   model_numbers: {
  //                     title: 'List of models',
  //                     description:
  //                       'Contains a list of parts, or full model numbers.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     uniqueItems: true,
  //                     items: {
  //                       title: 'Model number',
  //                       description:
  //                         'Contains a part, or a full model number of the component to identify.',
  //                       type: 'string',
  //                       minLength: 1,
  //                     },
  //                   },
  //                   purl: {
  //                     title: 'package URL representation',
  //                     description:
  //                       'The package URL (purl) attribute refers to a method for reliably identifying and locating software packages external to this specification.',
  //                     type: 'string',
  //                     format: 'uri',
  //                     pattern: '^pkg:[A-Za-z\\.\\-\\+][A-Za-z0-9\\.\\-\\+]*/.+',
  //                     minLength: 7,
  //                   },
  //                   sbom_urls: {
  //                     title: 'List of SBOM URLs',
  //                     description:
  //                       'Contains a list of URLs where SBOMs for this product can be retrieved.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     items: {
  //                       title: 'SBOM URL',
  //                       description:
  //                         'Contains a URL of one SBOM for this product.',
  //                       type: 'string',
  //                       format: 'uri',
  //                     },
  //                   },
  //                   serial_numbers: {
  //                     title: 'List of serial numbers',
  //                     description:
  //                       'Contains a list of parts, or full serial numbers.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     uniqueItems: true,
  //                     items: {
  //                       title: 'Serial number',
  //                       description:
  //                         'Contains a part, or a full serial number of the component to identify.',
  //                       type: 'string',
  //                       minLength: 1,
  //                     },
  //                   },
  //                   skus: {
  //                     title: 'List of stock keeping units',
  //                     description:
  //                       'Contains a list of parts, or full stock keeping units.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     items: {
  //                       title: 'Stock keeping unit',
  //                       description:
  //                         'Contains a part, or a full stock keeping unit (SKU) which is used in the ordering process to identify the component.',
  //                       type: 'string',
  //                       minLength: 1,
  //                     },
  //                   },
  //                   x_generic_uris: {
  //                     title: 'List of generic URIs',
  //                     description:
  //                       'Contains a list of identifiers which are either vendor-specific or derived from a standard not yet supported.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     items: {
  //                       title: 'Generic URI',
  //                       description:
  //                         'Provides a generic extension point for any identifier which is either vendor-specific or derived from a standard not yet supported.',
  //                       type: 'object',
  //                       required: ['namespace', 'uri'],
  //                       properties: {
  //                         namespace: {
  //                           title: 'Namespace of the generic URI',
  //                           description:
  //                             'Refers to a URL which provides the name and knowledge about the specification used or is the namespace in which these values are valid.',
  //                           type: 'string',
  //                           format: 'uri',
  //                         },
  //                         uri: {
  //                           title: 'URI',
  //                           description: 'Contains the identifier itself.',
  //                           type: 'string',
  //                           format: 'uri',
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           lang_t: {
  //             title: 'Language type',
  //             description:
  //               'Identifies a language, corresponding to IETF BCP 47 / RFC 5646. See IETF language registry: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry',
  //             type: 'string',
  //             pattern:
  //               '^(([A-Za-z]{2,3}(-[A-Za-z]{3}(-[A-Za-z]{3}){0,2})?|[A-Za-z]{4,8})(-[A-Za-z]{4})?(-([A-Za-z]{2}|[0-9]{3}))?(-([A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-[A-WY-Za-wy-z0-9](-[A-Za-z0-9]{2,8})+)*(-[Xx](-[A-Za-z0-9]{1,8})+)?|[Xx](-[A-Za-z0-9]{1,8})+|[Ii]-[Dd][Ee][Ff][Aa][Uu][Ll][Tt]|[Ii]-[Mm][Ii][Nn][Gg][Oo])$',
  //             examples: [],
  //           },
  //           notes_t: {
  //             title: 'List of notes',
  //             description:
  //               'Contains notes which are specific to the current context.',
  //             type: 'array',
  //             minItems: 1,
  //             items: {
  //               title: 'Note',
  //               description:
  //                 'Is a place to put all manner of text blobs related to the current context.',
  //               type: 'object',
  //               required: ['category', 'text'],
  //               properties: {
  //                 audience: {
  //                   title: 'Audience of note',
  //                   description: 'Indicate who is intended to read it.',
  //                   type: 'string',
  //                   minLength: 1,
  //                   examples: [],
  //                 },
  //                 category: {
  //                   title: 'Note category',
  //                   description: 'Choice of what kind of note this is.',
  //                   type: 'string',
  //                   enum: [
  //                     'description',
  //                     'details',
  //                     'faq',
  //                     'general',
  //                     'legal_disclaimer',
  //                     'other',
  //                     'summary',
  //                   ],
  //                 },
  //                 text: {
  //                   title: 'Note contents',
  //                   description:
  //                     'The contents of the note. Content varies depending on type.',
  //                   type: 'string',
  //                   minLength: 1,
  //                 },
  //                 title: {
  //                   title: 'Title of note',
  //                   description:
  //                     'Provides a concise description of what is contained in the text of the note.',
  //                   type: 'string',
  //                   minLength: 1,
  //                   examples: [],
  //                 },
  //               },
  //             },
  //           },
  //           product_group_id_t: {
  //             title: 'Reference token for product group instance',
  //             description:
  //               'Token required to identify a group of products so that it can be referred to from other parts in the document. There is no predefined or required format for the product_group_id as long as it uniquely identifies a group in the context of the current document.',
  //             type: 'string',
  //             minLength: 1,
  //             examples: [],
  //           },
  //           product_groups_t: {
  //             title: 'List of product_group_ids',
  //             description:
  //               'Specifies a list of product_group_ids to give context to the parent item.',
  //             type: 'array',
  //             minItems: 1,
  //             uniqueItems: true,
  //             items: {
  //               $ref: '#/$defs/product_group_id_t',
  //             },
  //           },
  //           product_id_t: {
  //             title: 'Reference token for product instance',
  //             description:
  //               'Token required to identify a full_product_name so that it can be referred to from other parts in the document. There is no predefined or required format for the product_id as long as it uniquely identifies a product in the context of the current document.',
  //             type: 'string',
  //             minLength: 1,
  //             examples: [],
  //           },
  //           products_t: {
  //             title: 'List of product_ids',
  //             description:
  //               'Specifies a list of product_ids to give context to the parent item.',
  //             type: 'array',
  //             minItems: 1,
  //             uniqueItems: true,
  //             items: {
  //               $ref: '#/$defs/product_id_t',
  //             },
  //           },
  //           references_t: {
  //             title: 'List of references',
  //             description: 'Holds a list of references.',
  //             type: 'array',
  //             minItems: 1,
  //             items: {
  //               title: 'Reference',
  //               description:
  //                 'Holds any reference to conferences, papers, advisories, and other resources that are related and considered related to either a surrounding part of or the entire document and to be of value to the document consumer.',
  //               type: 'object',
  //               required: ['summary', 'url'],
  //               properties: {
  //                 category: {
  //                   title: 'Category of reference',
  //                   description:
  //                     'Indicates whether the reference points to the same document or vulnerability in focus (depending on scope) or to an external resource.',
  //                   type: 'string',
  //                   default: 'external',
  //                   enum: ['external', 'self'],
  //                 },
  //                 summary: {
  //                   title: 'Summary of the reference',
  //                   description: 'Indicates what this reference refers to.',
  //                   type: 'string',
  //                   minLength: 1,
  //                 },
  //                 url: {
  //                   title: 'URL of reference',
  //                   description: 'Provides the URL for the reference.',
  //                   type: 'string',
  //                   format: 'uri',
  //                 },
  //               },
  //             },
  //           },
  //           version_t: {
  //             title: 'Version',
  //             description:
  //               'Specifies a version string to denote clearly the evolution of the content of the document. Format must be either integer or semantic versioning.',
  //             type: 'string',
  //             pattern:
  //               '^(0|[1-9][0-9]*)$|^((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)$',
  //             examples: [],
  //           },
  //         },
  //         required: ['document'],
  //         properties: {
  //           document: {
  //             title: 'Document level meta-data',
  //             description:
  //               'Captures the meta-data about this document describing a particular set of security advisories.',
  //             type: 'object',
  //             required: [
  //               'category',
  //               'csaf_version',
  //               'publisher',
  //               'title',
  //               'tracking',
  //             ],
  //             properties: {
  //               acknowledgments: {
  //                 title: 'Document acknowledgments',
  //                 description:
  //                   'Contains a list of acknowledgment elements associated with the whole document.',
  //                 $ref: '#/$defs/acknowledgments_t',
  //               },
  //               aggregate_severity: {
  //                 title: 'Aggregate severity',
  //                 description:
  //                   "Is a vehicle that is provided by the document producer to convey the urgency and criticality with which the one or more vulnerabilities reported should be addressed. It is a document-level metric and applied to the document as a whole — not any specific vulnerability. The range of values in this field is defined according to the document producer's policies and procedures.",
  //                 type: 'object',
  //                 required: ['text'],
  //                 properties: {
  //                   namespace: {
  //                     title: 'Namespace of aggregate severity',
  //                     description: 'Points to the namespace so referenced.',
  //                     type: 'string',
  //                     format: 'uri',
  //                   },
  //                   text: {
  //                     title: 'Text of aggregate severity',
  //                     description:
  //                       'Provides a severity which is independent of - and in addition to - any other standard metric for determining the impact or severity of a given vulnerability (such as CVSS).',
  //                     type: 'string',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                 },
  //               },
  //               category: {
  //                 title: 'Document category',
  //                 description:
  //                   'Defines a short canonical name, chosen by the document producer, which will inform the end user as to the category of document.',
  //                 type: 'string',
  //                 pattern: '^[^\\s\\-_\\.](.*[^\\s\\-_\\.])?$',
  //                 minLength: 1,
  //                 examples: [],
  //               },
  //               csaf_version: {
  //                 title: 'CSAF version',
  //                 description:
  //                   'Gives the version of the CSAF specification which the document was generated for.',
  //                 type: 'string',
  //                 enum: ['2.0'],
  //               },
  //               distribution: {
  //                 title: 'Rules for sharing document',
  //                 description:
  //                   'Describe any constraints on how this document might be shared.',
  //                 type: 'object',
  //                 minProperties: 1,
  //                 properties: {
  //                   text: {
  //                     title: 'Textual description',
  //                     description:
  //                       'Provides a textual description of additional constraints.',
  //                     type: 'string',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                   tlp: {
  //                     title: 'Traffic Light Protocol (TLP)',
  //                     description:
  //                       'Provides details about the TLP classification of the document.',
  //                     type: 'object',
  //                     required: ['label'],
  //                     properties: {
  //                       label: {
  //                         title: 'Label of TLP',
  //                         description:
  //                           'Provides the TLP label of the document.',
  //                         type: 'string',
  //                         enum: ['AMBER', 'GREEN', 'RED', 'WHITE'],
  //                       },
  //                       url: {
  //                         title: 'URL of TLP version',
  //                         description:
  //                           'Provides a URL where to find the textual description of the TLP version which is used in this document. Default is the URL to the definition by FIRST.',
  //                         type: 'string',
  //                         default: '',
  //                         format: 'uri',
  //                         examples: [],
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //               lang: {
  //                 title: 'Document language',
  //                 description:
  //                   'Identifies the language used by this document, corresponding to IETF BCP 47 / RFC 5646.',
  //                 $ref: '#/$defs/lang_t',
  //               },
  //               notes: {
  //                 title: 'Document notes',
  //                 description:
  //                   'Holds notes associated with the whole document.',
  //                 $ref: '#/$defs/notes_t',
  //               },
  //               publisher: {
  //                 title: 'Publisher',
  //                 description:
  //                   'Provides information about the publisher of the document.',
  //                 type: 'object',
  //                 required: ['category', 'name', 'namespace'],
  //                 properties: {
  //                   category: {
  //                     title: 'Category of publisher',
  //                     description:
  //                       'Provides information about the category of publisher releasing the document.',
  //                     type: 'string',
  //                     enum: [
  //                       'coordinator',
  //                       'discoverer',
  //                       'other',
  //                       'translator',
  //                       'user',
  //                       'vendor',
  //                     ],
  //                   },
  //                   contact_details: {
  //                     title: 'Contact details',
  //                     description:
  //                       'Information on how to contact the publisher, possibly including details such as web sites, email addresses, phone numbers, and postal mail addresses.',
  //                     type: 'string',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                   issuing_authority: {
  //                     title: 'Issuing authority',
  //                     description:
  //                       "Provides information about the authority of the issuing party to release the document, in particular, the party's constituency and responsibilities or other obligations.",
  //                     type: 'string',
  //                     minLength: 1,
  //                   },
  //                   name: {
  //                     title: 'Name of publisher',
  //                     description: 'Contains the name of the issuing party.',
  //                     type: 'string',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                   namespace: {
  //                     title: 'Namespace of publisher',
  //                     description:
  //                       'Contains a URL which is under control of the issuing party and can be used as a globally unique identifier for that issuing party.',
  //                     type: 'string',
  //                     format: 'uri',
  //                     examples: [],
  //                   },
  //                 },
  //               },
  //               references: {
  //                 title: 'Document references',
  //                 description:
  //                   'Holds a list of references associated with the whole document.',
  //                 $ref: '#/$defs/references_t',
  //               },
  //               source_lang: {
  //                 title: 'Source language',
  //                 description:
  //                   'If this copy of the document is a translation then the value of this property describes from which language this document was translated.',
  //                 $ref: '#/$defs/lang_t',
  //               },
  //               title: {
  //                 title: 'Title of this document',
  //                 description:
  //                   'This SHOULD be a canonical name for the document, and sufficiently unique to distinguish it from similar documents.',
  //                 type: 'string',
  //                 minLength: 1,
  //                 examples: [],
  //               },
  //               tracking: {
  //                 title: 'Tracking',
  //                 description:
  //                   'Is a container designated to hold all management attributes necessary to track a CSAF document as a whole.',
  //                 type: 'object',
  //                 required: [
  //                   'current_release_date',
  //                   'id',
  //                   'initial_release_date',
  //                   'revision_history',
  //                   'status',
  //                   'version',
  //                 ],
  //                 properties: {
  //                   aliases: {
  //                     title: 'Aliases',
  //                     description:
  //                       'Contains a list of alternate names for the same document.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     uniqueItems: true,
  //                     items: {
  //                       title: 'Alternate name',
  //                       description:
  //                         'Specifies a non-empty string that represents a distinct optional alternative ID used to refer to the document.',
  //                       type: 'string',
  //                       minLength: 1,
  //                       examples: [],
  //                     },
  //                   },
  //                   current_release_date: {
  //                     title: 'Current release date',
  //                     description:
  //                       'The date when the current revision of this document was released',
  //                     type: 'string',
  //                     format: 'date-time',
  //                   },
  //                   generator: {
  //                     title: 'Document generator',
  //                     description:
  //                       'Is a container to hold all elements related to the generation of the document. These items will reference when the document was actually created, including the date it was generated and the entity that generated it.',
  //                     type: 'object',
  //                     required: ['engine'],
  //                     properties: {
  //                       date: {
  //                         title: 'Date of document generation',
  //                         description:
  //                           'This SHOULD be the current date that the document was generated. Because documents are often generated internally by a document producer and exist for a nonzero amount of time before being released, this field MAY be different from the Initial Release Date and Current Release Date.',
  //                         type: 'string',
  //                         format: 'date-time',
  //                       },
  //                       engine: {
  //                         title: 'Engine of document generation',
  //                         description:
  //                           'Contains information about the engine that generated the CSAF document.',
  //                         type: 'object',
  //                         required: ['name'],
  //                         properties: {
  //                           name: {
  //                             title: 'Engine name',
  //                             description:
  //                               'Represents the name of the engine that generated the CSAF document.',
  //                             type: 'string',
  //                             minLength: 1,
  //                             examples: [],
  //                           },
  //                           version: {
  //                             title: 'Engine version',
  //                             description:
  //                               'Contains the version of the engine that generated the CSAF document.',
  //                             type: 'string',
  //                             minLength: 1,
  //                             examples: [],
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                   id: {
  //                     title: 'Unique identifier for the document',
  //                     description:
  //                       'The ID is a simple label that provides for a wide range of numbering values, types, and schemes. Its value SHOULD be assigned and maintained by the original document issuing authority.',
  //                     type: 'string',
  //                     pattern: '^[\\S](.*[\\S])?$',
  //                     minLength: 1,
  //                     examples: [],
  //                   },
  //                   initial_release_date: {
  //                     title: 'Initial release date',
  //                     description:
  //                       'The date when this document was first published.',
  //                     type: 'string',
  //                     format: 'date-time',
  //                   },
  //                   revision_history: {
  //                     title: 'Revision history',
  //                     description:
  //                       'Holds one revision item for each version of the CSAF document, including the initial one.',
  //                     type: 'array',
  //                     minItems: 1,
  //                     items: {
  //                       title: 'Revision',
  //                       description:
  //                         'Contains all the information elements required to track the evolution of a CSAF document.',
  //                       type: 'object',
  //                       required: ['date', 'number', 'summary'],
  //                       properties: {
  //                         date: {
  //                           title: 'Date of the revision',
  //                           description: 'The date of the revision entry',
  //                           type: 'string',
  //                           format: 'date-time',
  //                         },
  //                         legacy_version: {
  //                           title: 'Legacy version of the revision',
  //                           description:
  //                             'Contains the version string used in an existing document with the same content.',
  //                           type: 'string',
  //                           minLength: 1,
  //                         },
  //                         number: {
  //                           $ref: '#/$defs/version_t',
  //                         },
  //                         summary: {
  //                           title: 'Summary of the revision',
  //                           description:
  //                             'Holds a single non-empty string representing a short description of the changes.',
  //                           type: 'string',
  //                           minLength: 1,
  //                           examples: [],
  //                         },
  //                       },
  //                     },
  //                   },
  //                   status: {
  //                     title: 'Document status',
  //                     description: 'Defines the draft status of the document.',
  //                     type: 'string',
  //                     enum: ['draft', 'final', 'interim'],
  //                   },
  //                   version: {
  //                     $ref: '#/$defs/version_t',
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           product_tree: {
  //             title: 'Product tree',
  //             description:
  //               'Is a container for all fully qualified product names that can be referenced elsewhere in the document.',
  //             type: 'object',
  //             minProperties: 1,
  //             properties: {
  //               branches: {
  //                 $ref: '#/$defs/branches_t',
  //               },
  //               full_product_names: {
  //                 title: 'List of full product names',
  //                 description: 'Contains a list of full product names.',
  //                 type: 'array',
  //                 minItems: 1,
  //                 items: {
  //                   $ref: '#/$defs/full_product_name_t',
  //                 },
  //               },
  //               product_groups: {
  //                 title: 'List of product groups',
  //                 description: 'Contains a list of product groups.',
  //                 type: 'array',
  //                 minItems: 1,
  //                 items: {
  //                   title: 'Product group',
  //                   description:
  //                     'Defines a new logical group of products that can then be referred to in other parts of the document to address a group of products with a single identifier.',
  //                   type: 'object',
  //                   required: ['group_id', 'product_ids'],
  //                   properties: {
  //                     group_id: {
  //                       $ref: '#/$defs/product_group_id_t',
  //                     },
  //                     product_ids: {
  //                       title: 'List of Product IDs',
  //                       description:
  //                         'Lists the product_ids of those products which known as one group in the document.',
  //                       type: 'array',
  //                       minItems: 2,
  //                       uniqueItems: true,
  //                       items: {
  //                         $ref: '#/$defs/product_id_t',
  //                       },
  //                     },
  //                     summary: {
  //                       title: 'Summary of the product group',
  //                       description:
  //                         'Gives a short, optional description of the group.',
  //                       type: 'string',
  //                       minLength: 1,
  //                       examples: [],
  //                     },
  //                   },
  //                 },
  //               },
  //               relationships: {
  //                 title: 'List of relationships',
  //                 description: 'Contains a list of relationships.',
  //                 type: 'array',
  //                 minItems: 1,
  //                 items: {
  //                   title: 'Relationship',
  //                   description:
  //                     'Establishes a link between two existing full_product_name_t elements, allowing the document producer to define a combination of two products that form a new full_product_name entry.',
  //                   type: 'object',
  //                   required: [
  //                     'category',
  //                     'full_product_name',
  //                     'product_reference',
  //                     'relates_to_product_reference',
  //                   ],
  //                   properties: {
  //                     category: {
  //                       title: 'Relationship category',
  //                       description:
  //                         'Defines the category of relationship for the referenced component.',
  //                       type: 'string',
  //                       enum: [
  //                         'default_component_of',
  //                         'external_component_of',
  //                         'installed_on',
  //                         'installed_with',
  //                         'optional_component_of',
  //                       ],
  //                     },
  //                     full_product_name: {
  //                       $ref: '#/$defs/full_product_name_t',
  //                     },
  //                     product_reference: {
  //                       title: 'Product reference',
  //                       description:
  //                         'Holds a Product ID that refers to the Full Product Name element, which is referenced as the first element of the relationship.',
  //                       $ref: '#/$defs/product_id_t',
  //                     },
  //                     relates_to_product_reference: {
  //                       title: 'Relates to product reference',
  //                       description:
  //                         'Holds a Product ID that refers to the Full Product Name element, which is referenced as the second element of the relationship.',
  //                       $ref: '#/$defs/product_id_t',
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           vulnerabilities: {
  //             title: 'Vulnerabilities',
  //             description:
  //               'Represents a list of all relevant vulnerability information items.',
  //             type: 'array',
  //             minItems: 1,
  //             items: {
  //               title: 'Vulnerability',
  //               description:
  //                 'Is a container for the aggregation of all fields that are related to a single vulnerability in the document.',
  //               type: 'object',
  //               minProperties: 1,
  //               properties: {
  //                 acknowledgments: {
  //                   title: 'Vulnerability acknowledgments',
  //                   description:
  //                     'Contains a list of acknowledgment elements associated with this vulnerability item.',
  //                   $ref: '#/$defs/acknowledgments_t',
  //                 },
  //                 cve: {
  //                   title: 'CVE',
  //                   description:
  //                     'Holds the MITRE standard Common Vulnerabilities and Exposures (CVE) tracking number for the vulnerability.',
  //                   type: 'string',
  //                   pattern: '^CVE-[0-9]{4}-[0-9]{4,}$',
  //                 },
  //                 cwe: {
  //                   title: 'CWE',
  //                   description:
  //                     'Holds the MITRE standard Common Weakness Enumeration (CWE) for the weakness associated.',
  //                   type: 'object',
  //                   required: ['id', 'name'],
  //                   properties: {
  //                     id: {
  //                       title: 'Weakness ID',
  //                       description:
  //                         'Holds the ID for the weakness associated.',
  //                       type: 'string',
  //                       pattern: '^CWE-[1-9]\\d{0,5}$',
  //                       examples: [],
  //                     },
  //                     name: {
  //                       title: 'Weakness name',
  //                       description:
  //                         'Holds the full name of the weakness as given in the CWE specification.',
  //                       type: 'string',
  //                       minLength: 1,
  //                       examples: [],
  //                     },
  //                   },
  //                 },
  //                 discovery_date: {
  //                   title: 'Discovery date',
  //                   description:
  //                     'Holds the date and time the vulnerability was originally discovered.',
  //                   type: 'string',
  //                   format: 'date-time',
  //                 },
  //                 flags: {
  //                   title: 'List of flags',
  //                   description: 'Contains a list of machine readable flags.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   uniqueItems: true,
  //                   items: {
  //                     title: 'Flag',
  //                     description:
  //                       'Contains product specific information in regard to this vulnerability as a single machine readable flag.',
  //                     type: 'object',
  //                     required: ['label'],
  //                     properties: {
  //                       date: {
  //                         title: 'Date of the flag',
  //                         description:
  //                           'Contains the date when assessment was done or the flag was assigned.',
  //                         type: 'string',
  //                         format: 'date-time',
  //                       },
  //                       group_ids: {
  //                         $ref: '#/$defs/product_groups_t',
  //                       },
  //                       label: {
  //                         title: 'Label of the flag',
  //                         description: 'Specifies the machine readable label.',
  //                         type: 'string',
  //                         enum: [
  //                           'component_not_present',
  //                           'inline_mitigations_already_exist',
  //                           'vulnerable_code_cannot_be_controlled_by_adversary',
  //                           'vulnerable_code_not_in_execute_path',
  //                           'vulnerable_code_not_present',
  //                         ],
  //                       },
  //                       product_ids: {
  //                         $ref: '#/$defs/products_t',
  //                       },
  //                     },
  //                   },
  //                 },
  //                 ids: {
  //                   title: 'List of IDs',
  //                   description:
  //                     'Represents a list of unique labels or tracking IDs for the vulnerability (if such information exists).',
  //                   type: 'array',
  //                   minItems: 1,
  //                   uniqueItems: true,
  //                   items: {
  //                     title: 'ID',
  //                     description:
  //                       'Contains a single unique label or tracking ID for the vulnerability.',
  //                     type: 'object',
  //                     required: ['system_name', 'text'],
  //                     properties: {
  //                       system_name: {
  //                         title: 'System name',
  //                         description:
  //                           'Indicates the name of the vulnerability tracking or numbering system.',
  //                         type: 'string',
  //                         minLength: 1,
  //                         examples: [],
  //                       },
  //                       text: {
  //                         title: 'Text',
  //                         description:
  //                           'Is unique label or tracking ID for the vulnerability (if such information exists).',
  //                         type: 'string',
  //                         minLength: 1,
  //                         examples: [],
  //                       },
  //                     },
  //                   },
  //                 },
  //                 involvements: {
  //                   title: 'List of involvements',
  //                   description: 'Contains a list of involvements.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   uniqueItems: true,
  //                   items: {
  //                     title: 'Involvement',
  //                     description:
  //                       'Is a container, that allows the document producers to comment on the level of involvement (or engagement) of themselves or third parties in the vulnerability identification, scoping, and remediation process.',
  //                     type: 'object',
  //                     required: ['party', 'status'],
  //                     properties: {
  //                       date: {
  //                         title: 'Date of involvement',
  //                         description:
  //                           'Holds the date and time of the involvement entry.',
  //                         type: 'string',
  //                         format: 'date-time',
  //                       },
  //                       party: {
  //                         title: 'Party category',
  //                         description:
  //                           'Defines the category of the involved party.',
  //                         type: 'string',
  //                         enum: [
  //                           'coordinator',
  //                           'discoverer',
  //                           'other',
  //                           'user',
  //                           'vendor',
  //                         ],
  //                       },
  //                       status: {
  //                         title: 'Party status',
  //                         description:
  //                           'Defines contact status of the involved party.',
  //                         type: 'string',
  //                         enum: [
  //                           'completed',
  //                           'contact_attempted',
  //                           'disputed',
  //                           'in_progress',
  //                           'not_contacted',
  //                           'open',
  //                         ],
  //                       },
  //                       summary: {
  //                         title: 'Summary of the involvement',
  //                         description:
  //                           'Contains additional context regarding what is going on.',
  //                         type: 'string',
  //                         minLength: 1,
  //                       },
  //                     },
  //                   },
  //                 },
  //                 notes: {
  //                   title: 'Vulnerability notes',
  //                   description:
  //                     'Holds notes associated with this vulnerability item.',
  //                   $ref: '#/$defs/notes_t',
  //                 },
  //                 product_status: {
  //                   title: 'Product status',
  //                   description:
  //                     'Contains different lists of product_ids which provide details on the status of the referenced product related to the current vulnerability. ',
  //                   type: 'object',
  //                   minProperties: 1,
  //                   properties: {
  //                     first_affected: {
  //                       title: 'First affected',
  //                       description:
  //                         'These are the first versions of the releases known to be affected by the vulnerability.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     first_fixed: {
  //                       title: 'First fixed',
  //                       description:
  //                         'These versions contain the first fix for the vulnerability but may not be the recommended fixed versions.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     fixed: {
  //                       title: 'Fixed',
  //                       description:
  //                         'These versions contain a fix for the vulnerability but may not be the recommended fixed versions.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     known_affected: {
  //                       title: 'Known affected',
  //                       description:
  //                         'These versions are known to be affected by the vulnerability.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     known_not_affected: {
  //                       title: 'Known not affected',
  //                       description:
  //                         'These versions are known not to be affected by the vulnerability.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     last_affected: {
  //                       title: 'Last affected',
  //                       description:
  //                         'These are the last versions in a release train known to be affected by the vulnerability. Subsequently released versions would contain a fix for the vulnerability.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     recommended: {
  //                       title: 'Recommended',
  //                       description:
  //                         'These versions have a fix for the vulnerability and are the vendor-recommended versions for fixing the vulnerability.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                     under_investigation: {
  //                       title: 'Under investigation',
  //                       description:
  //                         'It is not known yet whether these versions are or are not affected by the vulnerability. However, it is still under investigation - the result will be provided in a later release of the document.',
  //                       $ref: '#/$defs/products_t',
  //                     },
  //                   },
  //                 },
  //                 references: {
  //                   title: 'Vulnerability references',
  //                   description:
  //                     'Holds a list of references associated with this vulnerability item.',
  //                   $ref: '#/$defs/references_t',
  //                 },
  //                 release_date: {
  //                   title: 'Release date',
  //                   description:
  //                     'Holds the date and time the vulnerability was originally released into the wild.',
  //                   type: 'string',
  //                   format: 'date-time',
  //                 },
  //                 remediations: {
  //                   title: 'List of remediations',
  //                   description: 'Contains a list of remediations.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   items: {
  //                     title: 'Remediation',
  //                     description:
  //                       'Specifies details on how to handle (and presumably, fix) a vulnerability.',
  //                     type: 'object',
  //                     required: ['category', 'details'],
  //                     properties: {
  //                       category: {
  //                         title: 'Category of the remediation',
  //                         description:
  //                           'Specifies the category which this remediation belongs to.',
  //                         type: 'string',
  //                         enum: [
  //                           'mitigation',
  //                           'no_fix_planned',
  //                           'none_available',
  //                           'vendor_fix',
  //                           'workaround',
  //                         ],
  //                       },
  //                       date: {
  //                         title: 'Date of the remediation',
  //                         description:
  //                           'Contains the date from which the remediation is available.',
  //                         type: 'string',
  //                         format: 'date-time',
  //                       },
  //                       details: {
  //                         title: 'Details of the remediation',
  //                         description:
  //                           'Contains a thorough human-readable discussion of the remediation.',
  //                         type: 'string',
  //                         minLength: 1,
  //                       },
  //                       entitlements: {
  //                         title: 'List of entitlements',
  //                         description: 'Contains a list of entitlements.',
  //                         type: 'array',
  //                         minItems: 1,
  //                         items: {
  //                           title: 'Entitlement of the remediation',
  //                           description:
  //                             'Contains any possible vendor-defined constraints for obtaining fixed software or hardware that fully resolves the vulnerability.',
  //                           type: 'string',
  //                           minLength: 1,
  //                         },
  //                       },
  //                       group_ids: {
  //                         $ref: '#/$defs/product_groups_t',
  //                       },
  //                       product_ids: {
  //                         $ref: '#/$defs/products_t',
  //                       },
  //                       restart_required: {
  //                         title: 'Restart required by remediation',
  //                         description:
  //                           'Provides information on category of restart is required by this remediation to become effective.',
  //                         type: 'object',
  //                         required: ['category'],
  //                         properties: {
  //                           category: {
  //                             title: 'Category of restart',
  //                             description:
  //                               'Specifies what category of restart is required by this remediation to become effective.',
  //                             type: 'string',
  //                             enum: [
  //                               'connected',
  //                               'dependencies',
  //                               'machine',
  //                               'none',
  //                               'parent',
  //                               'service',
  //                               'system',
  //                               'vulnerable_component',
  //                               'zone',
  //                             ],
  //                           },
  //                           details: {
  //                             title: 'Additional restart information',
  //                             description:
  //                               'Provides additional information for the restart. This can include details on procedures, scope or impact.',
  //                             type: 'string',
  //                             minLength: 1,
  //                           },
  //                         },
  //                       },
  //                       url: {
  //                         title: 'URL to the remediation',
  //                         description:
  //                           'Contains the URL where to obtain the remediation.',
  //                         type: 'string',
  //                         format: 'uri',
  //                       },
  //                     },
  //                   },
  //                 },
  //                 scores: {
  //                   title: 'List of scores',
  //                   description:
  //                     'contains score objects for the current vulnerability.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   items: {
  //                     title: 'Score',
  //                     description:
  //                       'specifies information about (at least one) score of the vulnerability and for which products the given value applies.',
  //                     type: 'object',
  //                     minProperties: 2,
  //                     required: ['products'],
  //                     properties: {
  //                       cvss_v2: {
  //                         $ref: '',
  //                       },
  //                       cvss_v3: {
  //                         oneOf: [
  //                           {
  //                             $ref: '',
  //                           },
  //                           {
  //                             $ref: '',
  //                           },
  //                         ],
  //                       },
  //                       products: {
  //                         $ref: '#/$defs/products_t',
  //                       },
  //                     },
  //                   },
  //                 },
  //                 threats: {
  //                   title: 'List of threats',
  //                   description:
  //                     'Contains information about a vulnerability that can change with time.',
  //                   type: 'array',
  //                   minItems: 1,
  //                   items: {
  //                     title: 'Threat',
  //                     description:
  //                       'Contains the vulnerability kinetic information. This information can change as the vulnerability ages and new information becomes available.',
  //                     type: 'object',
  //                     required: ['category', 'details'],
  //                     properties: {
  //                       category: {
  //                         title: 'Category of the threat',
  //                         description:
  //                           'Categorizes the threat according to the rules of the specification.',
  //                         type: 'string',
  //                         enum: ['exploit_status', 'impact', 'target_set'],
  //                       },
  //                       date: {
  //                         title: 'Date of the threat',
  //                         description:
  //                           'Contains the date when the assessment was done or the threat appeared.',
  //                         type: 'string',
  //                         format: 'date-time',
  //                       },
  //                       details: {
  //                         title: 'Details of the threat',
  //                         description:
  //                           'Represents a thorough human-readable discussion of the threat.',
  //                         type: 'string',
  //                         minLength: 1,
  //                       },
  //                       group_ids: {
  //                         $ref: '#/$defs/product_groups_t',
  //                       },
  //                       product_ids: {
  //                         $ref: '#/$defs/products_t',
  //                       },
  //                     },
  //                   },
  //                 },
  //                 title: {
  //                   title: 'Title',
  //                   description:
  //                     'Gives the document producer the ability to apply a canonical name or title to the vulnerability.',
  //                   type: 'string',
  //                   minLength: 1,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   ],
  // })

  const onChangeMonaco = (
    /** @type {any} */ newValue,
    /** @type {any} */ e
  ) => {
    console.log('onChangeMonaco', newValue, e)
  }
  const options = {
    selectOnLineNumbers: true,
    automaticLayout: true,
  }

  return (
    <>
      <MinAlert />
      <MaxAlert />

      <div className="json-editor flex h-full mr-3 bg-white">
        <div className=" w-full">
          <div className={'relative ' + (showErrors ? 'h-4/5' : 'h-full')}>
            <MonacoEditor
              width="inherit"
              height="inherit"
              language="json"
              theme="vs-white"
              value={code}
              options={options}
              onChange={onChangeMonaco}
              editorDidMount={editorDidMount}
              editorWillMount={editorWillMount}
            />
          </div>
          <div
            className={
              'overflow-auto p-3 border border-red-600 bg-red-200 ' +
              (showErrors ? 'h-1/5' : 'hidden')
            }
          >
            <div className="flex justify-between items-start h-full">
              <div className="pr-4">
                <h2 className="text-xl font-bold">
                  Validation <br /> Errors:
                </h2>
              </div>
              <div className="mx-2 flex-grow overflow-auto h-full">
                {errors.map((error, i) => (
                  <div key={i}>
                    <b>{error.instancePath}</b>: {error.message}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="text-xl text-red-400"
                onClick={() => setShowErrors(false)}
              >
                <FontAwesomeIcon className="mr-1" icon={faWindowClose} />
              </button>
            </div>
          </div>
        </div>
        <div className="pl-3 pr-6 py-6 w-72 flex flex-col justify-between">
          <div className="flex flex-col">
            <button
              type="button"
              className="mb-2 py-1 px-3 rounded shadow border border-blue-400 bg-blue-400 text-white hover:text-blue-400 hover:bg-white"
              onClick={showMin}
            >
              <FontAwesomeIcon className="mr-1" icon={faFile} />
              New (minimal fields)
            </button>
            <button
              type="button"
              className="mb-2 py-1 px-3 rounded shadow border border-blue-400 bg-blue-400 text-white hover:text-blue-400 hover:bg-white"
              onClick={showMax}
            >
              <FontAwesomeIcon className="mr-1" icon={faFileAlt} />
              New (all fields)
            </button>
            <label
              htmlFor="openFile"
              className="mb-2 py-1 px-3 text-center rounded shadow border border-blue-400 bg-blue-400 text-white hover:text-blue-400 hover:bg-white"
            >
              <FontAwesomeIcon className="mr-1" icon={faFolderOpen} />
              Open
            </label>
            <input
              id="openFile"
              title="open file"
              type="file"
              className="hidden"
              accept="application/json"
              onChange={(e) => {
                if (!e.target.files || !e.target.files[0]) return
                if (e.target.files[0].size > 1 * 1024 * 1024) {
                  window.alert('File too large!')
                  return
                }
                handleOpen(e.target.files[0])
              }}
            />
          </div>
          <div>
            {showExpertSettings ? (
              <div className="mb-6">
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input
                    checked={strict}
                    type="checkbox"
                    name="toggle"
                    id="toggleExpertSettings"
                    onChange={toggleStrict}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    htmlFor="toggleExpertSettings"
                    className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="toggleExpertSettings"
                  className="text-xs text-gray-500"
                >
                  Disallow non-standard properties
                </label>
              </div>
            ) : (
              <button
                type="button"
                className="py-1 px-3 mb-6 h-9 underline text-gray-500"
                onClick={toggleExpertSettings}
              >
                <FontAwesomeIcon className="mr-1" icon={faCog} />
                Show expert settings
              </button>
            )}

            <h2 className="mb-4 text-xl font-bold">Validation Status</h2>
            {errors.length === 0 ? (
              <>
                <div className="mb-4 flex justify-end">
                  <FontAwesomeIcon
                    className="text-6xl text-green-500"
                    icon={faCheckCircle}
                  />
                </div>
                <div className="h-9" />
              </>
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <span className="text-6xl text-red-500 font-bold">
                    {errors.length}
                  </span>
                  <FontAwesomeIcon
                    className="text-6xl text-red-500"
                    icon={faExclamationTriangle}
                  />
                </div>
                <button
                  type="button"
                  className="py-1 px-3 h-9 underline text-gray-500"
                  onClick={toggleShowErrors}
                >
                  {showErrors ? 'Hide errors' : 'Show errors'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
