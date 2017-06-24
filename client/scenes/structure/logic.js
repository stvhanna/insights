import Logic, { initLogic } from 'kea/logic'
import { PropTypes } from 'react'

@initLogic
export default class StructureLogic extends Logic {
  path = () => ['scenes', 'structure', 'index']

  actions = ({ constants }) => ({
    openConnections: true,
    startLoading: true,
    connectionLoaded: connection => ({ connection }),
    structureLoaded: structure => ({ structure }),

    selectModel: model => ({ model }),

    addChange: (model, column, key, change, original) => ({ model, column, key, change, original })
  })

  reducers = ({ actions, constants }) => ({
    isLoading: [false, PropTypes.bool, {
      [actions.startLoading]: () => true,
      [actions.structureLoaded]: () => false
    }],
    connection: [null, PropTypes.object, {
      [actions.startLoading]: () => null,
      [actions.connectionLoaded]: (_, payload) => payload.connection
    }],
    structure: [null, PropTypes.object, {
      [actions.startLoading]: () => null,
      [actions.structureLoaded]: (_, payload) => payload.structure
    }],
    structureChanges: [{}, PropTypes.object, {
      [actions.startLoading]: () => ({}),
      [actions.structureLoaded]: () => ({}),
      [actions.addChange]: (state, payload) => {
        const { model, column, key, change, original } = payload

        let newColumn = {}

        if (change === original) {
          const { [key]: discard, ...rest } = (state[model] || {})[column] // eslint-disable-line
          newColumn = rest
        } else {
          newColumn = {
            ...(state[model] || {})[column],
            [key]: change
          }
        }

        return {
          ...state,
          [model]: {
            ...(state[model] || {}),
            [column]: newColumn
          }
        }
      }
    }],
    selectedModel: [null, PropTypes.string, {
      [actions.selectModel]: (_, payload) => payload.model
    }]
  })

  selectors = ({ constants, selectors }) => ({
    models: [
      () => [selectors.structure],
      (structure) => structure ? Object.keys(structure).sort((a, b) => a.localeCompare(b)) : [],
      PropTypes.array
    ],

    combinedStructure: [
      () => [selectors.structure],
      (structure) => {
        if (!structure) {
          return {}
        }

        let combinedStructure = {}

        Object.keys(structure).forEach(model => {
          let structureForModel = {}
          Object.keys(structure[model].columns).forEach(key => {
            structureForModel[key] = Object.assign({ group: 'column', key: key }, structure[model].columns[key])
          })
          Object.keys(structure[model].links).forEach(key => {
            structureForModel[key] = Object.assign({ group: 'link', key: key }, structure[model].links[key])
          })
          Object.keys(structure[model].custom).forEach(key => {
            structureForModel[key] = Object.assign({ group: 'custom', key: key }, structure[model].custom[key])
          })
          combinedStructure[model] = structureForModel
        })

        return combinedStructure
      },
      PropTypes.object
    ],

    numberOfChanges: [
      () => [selectors.structureChanges],
      (structureChanges) => {
        let changeCount = 0
        Object.values(structureChanges || {}).forEach(modelChanges => {
          Object.values(modelChanges || {}).forEach(typeChanges => {
            Object.values(typeChanges || {}).forEach(valueChanges => {
              changeCount += Object.keys(valueChanges).length
            })
          })
        })
        return changeCount
      },
      PropTypes.number
    ]
  })
}
