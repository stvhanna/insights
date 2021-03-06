import Logic, { initLogic } from 'kea/logic'
import { PropTypes } from 'react'

import moment from 'moment'

@initLogic
export default class ExplorerLogic extends Logic {
  path = () => ['scenes', 'explorer', 'index']

  constants = () => [
    // 'SHOW_ALL',
    // 'SHOW_ACTIVE',
    // 'SHOW_COMPLETED'
  ]

  actions = ({ constants }) => ({
    setConnections: connections => ({ connections }),
    setConnection: connection => ({ connection }),

    setStructure: structure => ({ structure }),

    setColumnsAndFilter: (columns, filter) => ({ columns, filter }),
    setColumns: columns => ({ columns }),
    addColumn: column => ({ column }),
    removeColumn: column => ({ column }),
    removeColumnWithIndex: index => ({ index }),
    removeColumnsWithPath: path => ({ path }),
    setTransform: (index, transform, aggregate) => ({ index, transform, aggregate }),
    setFacetsColumn: (facetsColumn) => ({ facetsColumn }),
    setFacetsCount: (facetsCount) => ({ facetsCount }),
    setGraphCumulative: (graphCumulative) => ({ graphCumulative }),
    setPercentages: (percentages) => ({ percentages }),
    setExportTitle: (exportTitle) => ({ exportTitle }),
    urlChanged: values => (values),

    digDeeper: row => ({ row }),

    clear: true,
    refreshData: true,
    clearColumnWidths: true,

    setLoading: true,
    clearLoading: true,

    setColumnWidth: (width, key) => ({ width, key }),
    setVisibleRows: (start, end) => ({ start, end }),
    setPagination: (offset, limit) => ({ offset, limit }),
    setResults: (results, resetScrolling) => ({ results, resetScrolling }),
    setSort: (sort) => ({ sort }),

    addFilter: ({ key, value }) => ({ filter: { key, value } }),
    addEmptyFilter: (key) => ({ key }),
    removeFilter: (index) => ({ index }),
    removeFiltersByKey: (key) => ({ key }),
    setFilter: (index, filter) => ({ index, filter }),

    setGraphTimeFilter: (graphTimeFilter) => ({ graphTimeFilter }),

    openTreeNode: (path) => ({ path }),
    closeTreeNode: (path) => ({ path }),
    collapseChildNodes: (path) => ({ path }),

    setSearch: (search) => ({ search }),

    requestExport: (format) => ({ format }),

    addToDashboard: ({ id, name, path }) => ({ id, name, path }),
    dashboardsLoaded: (dashboards) => ({ dashboards })
  })

  reducers = ({ actions, constants }) => ({
    search: ['', PropTypes.string, {
      [actions.setSearch]: (_, payload) => payload.search
    }],
    connections: [{}, PropTypes.object, {
      [actions.setConnections]: (_, payload) => {
        let newState = {}
        payload.connections.forEach(connection => {
          newState[connection.keyword] = connection
        })
        return newState
      }
    }],
    connection: [null, PropTypes.string, {
      [actions.setConnection]: (_, payload) => payload.connection,
      [actions.urlChanged]: (state, payload) => payload.connection || state
    }],
    // shape of each model
    structure: [{}, PropTypes.object, {
      [actions.setStructure]: (_, payload) => payload.structure
    }],
    // tree state
    treeState: [{}, PropTypes.object, {
      [actions.openTreeNode]: (state, payload) => Object.assign({}, state, { [payload.path]: true }),
      [actions.closeTreeNode]: (state, payload) => {
        const { [payload.path]: discard, ...rest } = state // eslint-disable-line
        return rest
      },
      [actions.collapseChildNodes]: (state, payload) => {
        const collapseFrom = `${payload.path}.`
        const openNodes = Object.keys(state)
        let newState = {}
        openNodes.forEach(node => {
          if (node.indexOf(collapseFrom) === -1) {
            newState[node] = true
          }
        })
        return newState
      },
      [actions.clear]: () => ({}),
      [actions.urlChanged]: (_, payload) => payload.treeState
    }],
    // what we want the selected columns to be
    columns: [[], PropTypes.array, {
      [actions.setColumnsAndFilter]: (state, payload) => payload.columns,
      [actions.setColumns]: (state, payload) => payload.columns,
      [actions.addColumn]: (state, payload) => state.concat([payload.column]),
      [actions.removeColumn]: (state, payload) => state.filter(column => column !== payload.column),
      [actions.removeColumnWithIndex]: (state, payload) => {
        let i = 0
        return state.filter(column => i++ !== payload.index)
      },
      [actions.removeColumnsWithPath]: (state, payload) => state.filter(column => column.split('!')[0] !== payload.path),
      [actions.setResults]: (_, payload) => payload.results.columns,
      [actions.clear]: () => [],
      [actions.urlChanged]: (_, payload) => payload.columns,
      [actions.setTransform]: (state, payload) => {
        let i = 0
        return state.map(column => payload.index === i++ ? column.split('!')[0] + (payload.transform || payload.aggregate ? `!${payload.transform || ''}` + (payload.aggregate ? `!${payload.aggregate}` || '' : '') : '') : column)
      }
    }],
    // meta for columns returned by the server
    columnsMeta: [{}, PropTypes.object, {
      [actions.setResults]: (_, payload) => payload.results.columnsMeta,
      [actions.clear]: () => ({})
    }],
    // filter set by us/server
    filter: [[], PropTypes.array, {
      [actions.setResults]: (_, payload) => payload.results.filter,
      [actions.setColumnsAndFilter]: (_, payload) => payload.filter,
      [actions.setFilter]: (state, payload) => {
        let newFilter = []

        for (let i = 0; i < state.length; i++) {
          if (i === payload.index) {
            newFilter.push({ ...state[i], value: payload.filter })
          } else {
            newFilter.push(state[i])
          }
        }

        return newFilter
      },
      [actions.addFilter]: (state, payload) => state.concat([payload.filter]),
      [actions.addEmptyFilter]: (state, payload) => state.concat([{ key: payload.key, value: '' }]),
      [actions.removeFilter]: (state, payload) => {
        let newFilter = []

        for (let i = 0; i < state.length; i++) {
          if (i !== payload.index) {
            newFilter.push(state[i])
          }
        }

        return newFilter
      },
      [actions.removeFiltersByKey]: (state, payload) => state.filter(({ key, value }) => key !== payload.key),
      [actions.clear]: () => ([]),
      [actions.urlChanged]: (_, payload) => payload.filter
    }],
    results: [[], PropTypes.array, {
      [actions.setColumns]: () => [],
      [actions.setColumnsAndFilter]: () => [],
      [actions.addColumn]: () => [],
      [actions.removeColumn]: () => [],
      [actions.setResults]: (_, payload) => payload.results.results,
      [actions.clear]: () => []
    }],
    offsetTarget: [0, PropTypes.number, {
      [actions.setPagination]: (_, payload) => payload.offset
    }],
    offset: [0, PropTypes.number, {
      [actions.setResults]: (_, payload) => payload.results.offset,
      [actions.setColumns]: () => 0,
      [actions.setColumnsAndFilter]: () => 0,
      [actions.addColumn]: () => 0,
      [actions.removeColumn]: () => 0,
      [actions.clear]: () => 0
    }],
    limitTarget: [100, PropTypes.number, {
      [actions.setPagination]: (_, payload) => payload.limit
    }],
    limit: [100, PropTypes.number, {
      [actions.setPagination]: (_, payload) => payload.limit,
      [actions.setResults]: (_, payload) => payload.results.limit
    }],
    visibleStart: [0, PropTypes.number, {
      [actions.setVisibleRows]: (_, payload) => payload.start
    }],
    visibleEnd: [0, PropTypes.number, {
      [actions.setVisibleRows]: (_, payload) => payload.end
    }],
    count: [0, PropTypes.number, {
      [actions.setResults]: (_, payload) => payload.results.count,
      [actions.clear]: () => 0
    }],
    isSubmitting: [false, PropTypes.bool, {
      [actions.setLoading]: () => true,
      [actions.setResults]: () => false,
      [actions.clearLoading]: () => false
    }],
    sort: [null, PropTypes.string, {
      [actions.setSort]: (_, payload) => payload.sort,
      [actions.setResults]: (_, payload) => payload.results.sort,
      [actions.urlChanged]: (_, payload) => payload.sort,
      [actions.clear]: () => null
    }],
    columnWidths: [{}, PropTypes.object, {
      [actions.setColumnWidth]: (state, payload) => ({ ...state, [payload.key]: payload.width }),
      [actions.clearColumnWidths]: (_, payload) => ({}),
      [actions.clear]: (_, payload) => ({})
    }],
    // used as a bridge between a kind-of-controlled-but-also-uncontrolled fixed-data-table-2 component and the saga
    scrollingResetCounter: [0, PropTypes.number, {
      [actions.setResults]: (state, payload) => payload.resetScrolling ? state + 1 : state
    }],
    graph: [null, PropTypes.object, {
      [actions.setResults]: (_, payload) => payload.results.graph,
      [actions.clear]: () => null
    }],
    graphTimeFilter: ['last-60', PropTypes.string, {
      [actions.setGraphTimeFilter]: (_, payload) => payload.graphTimeFilter,
      [actions.urlChanged]: (state, payload) => payload.graphTimeFilter || state,
      [actions.setResults]: (state, payload) => payload.results.graphTimeFilter || state
    }],
    graphCumulative: [false, PropTypes.bool, {
      [actions.setGraphCumulative]: (_, payload) => payload.graphCumulative,
      [actions.urlChanged]: (state, payload) => payload.graphCumulative,
      [actions.setResults]: (state, payload) => payload.results.graphCumulative
    }],
    percentages: [false, PropTypes.bool, {
      [actions.setPercentages]: (_, payload) => payload.percentages,
      [actions.urlChanged]: (state, payload) => payload.percentages,
      [actions.setResults]: (state, payload) => payload.results.percentages
    }],
    facetsColumn: [null, PropTypes.string, {
      [actions.setFacetsColumn]: (state, payload) => payload.facetsColumn,
      [actions.urlChanged]: (state, payload) => payload.facetsColumn,
      [actions.setResults]: (state, payload) => payload.results.facetsColumn,
      [actions.clear]: () => null
    }],
    facetsCount: [null, PropTypes.number, {
      [actions.setFacetsCount]: (state, payload) => payload.facetsCount,
      [actions.urlChanged]: (state, payload) => payload.facetsCount,
      [actions.setResults]: (state, payload) => payload.results.facetsCount,
      [actions.clear]: () => 6
    }],
    exportTitle: ['', PropTypes.string, {
      [actions.setExportTitle]: (state, payload) => payload.exportTitle,
      [actions.clear]: () => ''
    }],

    // { 1: { layout: [{x,y,w,h,path,name}], name: .. } }
    dashboards: [{}, PropTypes.object, {
      [actions.dashboardsLoaded]: (_, payload) => {
        let newState = {}
        payload.dashboards.forEach(dashboard => {
          newState[dashboard._id] = dashboard
        })
        return newState
      }
    }]
  })

  selectors = ({ constants, selectors }) => ({
    models: [
      () => [selectors.structure],
      (structure) => {
        if (!structure) {
          return []
        }
        return Object.keys(structure).filter(key => structure[key].enabled)
      },
      PropTypes.array
    ],

    selectedModel: [
      () => [selectors.treeState],
      (treeState) => {
        return Object.keys(treeState).length > 0 ? Object.keys(treeState)[0].split('.')[0] : null
      },
      PropTypes.string
    ],

    graphKeys: [
      () => [selectors.graph],
      (graph) => {
        if (!graph) {
          return null
        }
        return graph.keys // .map(k => k.type === 'time' ? null : k.column.replace(/!/g, ' ').replace(/^[^.]+\./, ''))
      },
      PropTypes.array
    ],

    graphData: [
      () => [selectors.graph, selectors.graphKeys],
      (graph, graphKeys) => {
        if (!graph) {
          return null
        }

        const graphRows = graph.results.map(row => {
          const time = row.time
          return Object.assign({}, row, { time: moment(time).valueOf() })
        })

        return graphRows
      },
      PropTypes.array
    ],

    filterKeys: [
      () => [selectors.filter],
      (filter) => {
        return filter.map(f => f.key)
      },
      PropTypes.array
    ],

    url: [
      () => [
        selectors.connection, selectors.columns, selectors.sort, selectors.treeState, selectors.graphTimeFilter,
        selectors.facetsColumn, selectors.facetsCount, selectors.filter, selectors.graphCumulative, selectors.percentages
      ],
      (connection, columns, sort, treeState, graphTimeFilter, facetsColumn, facetsCount, filter, graphCumulative, percentages) => {
        let url = {
          connection: connection,
          columns: columns.join(','),
          sort: sort || '',
          treeState: Object.keys(treeState).join(','),
          graphTimeFilter: graphTimeFilter || '',
          facetsColumn: facetsColumn || '',
          facetsCount: facetsCount || '',
          graphCumulative: graphCumulative || false,
          percentages: percentages || false
        }

        let i = 0
        filter.forEach(({ key, value }) => {
          url[`filter[${i++}]`] = `${key}=${value}`
        })

        const anythingSelected = Object.values(url).filter(v => v).length > 0

        const pathname = '/explorer'
        const search = anythingSelected ? '?' + Object.entries(url).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&') : ''

        return `${pathname}${search}`
      },
      PropTypes.string
    ]
  })
}
