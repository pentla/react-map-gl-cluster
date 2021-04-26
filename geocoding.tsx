import { PureComponent } from 'react'
import MapGL from 'react-map-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { FlyToInterpolator } from 'react-map-gl'
import WebMercatorViewport from 'viewport-mercator-project'
import { BBox } from '@turf/helpers'

const VALID_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

type Props = {
  mapRef: React.MutableRefObject<MapGL>
  containerRef?: React.MutableRefObject<HTMLDivElement>
  onViewportChange?: (value: any) => void
  mapboxApiAccessToken: string
  inputValue?: string
  origin?: string
  zoom?: number
  placeholder?: string
  proximity?: Record<string, unknown>
  trackProximity?: boolean
  collapsed?: boolean
  clearAndBlurOnEsc?: boolean
  clearOnBlur?: boolean
  bbox?: BBox
  types?: string
  countries?: string
  minLength?: number
  limit?: number
  language?: string
  filter?: () => any
  localGeocoder?: () => any
  reverseGeocode?: boolean
  enableEventLogging?: boolean
  render?: any
  getItemValue?: any
  position?: typeof VALID_POSITIONS[number]
  onInit?: (value: any) => void
  onClear?: () => void
  onLoading?: (value: any) => void
  onResults?: (value: any) => void
  onResult?: ({ result }: { result: GeocodingResult }) => void
  onError?: (value: any) => void
}

type GeocodingResult = {
  bbox: [number, number, number, number]
  center: [number, number]
  context: GeocodingContext[]
  id: string
  place_name: string
  place_name_ja: string
  place_type: string[]
  properties: Record<string, any>
  relevance: number
  text: string
  text_ja: string
  type: string
}

type GeocodingContext = {
  id: string
  language: string
  language_ja: string
  short_codes: string
  text: string
  text_ja: string
  wikidata: string
}

// eslint-disable-next-line
const emptyFunction = () => {}

class Geocoder extends PureComponent<Props> {
  geocoder = null
  cachedResult = null

  componentDidMount() {
    this.initializeGeocoder()
  }

  componentWillUnmount() {
    this.removeGeocoder()
  }

  componentDidUpdate() {
    this.removeGeocoder()
    this.initializeGeocoder()
  }

  initializeGeocoder = () => {
    const mapboxMap = this.getMapboxMap()
    const containerNode = this.getContainerNode()
    const {
      mapboxApiAccessToken,
      inputValue,
      origin,
      zoom,
      placeholder,
      proximity,
      trackProximity,
      collapsed,
      clearAndBlurOnEsc,
      clearOnBlur,
      bbox,
      types,
      countries,
      minLength,
      limit,
      language,
      filter,
      localGeocoder,
      reverseGeocode,
      enableEventLogging,
      render,
      getItemValue,
      onInit,
      position
    } = this.props
    const options = {
      accessToken: mapboxApiAccessToken,
      origin,
      zoom,
      flyTo: false,
      placeholder,
      proximity,
      trackProximity,
      collapsed,
      clearAndBlurOnEsc,
      clearOnBlur,
      bbox,
      types,
      countries,
      minLength,
      limit,
      language,
      filter,
      localGeocoder,
      reverseGeocode,
      enableEventLogging,
      marker: false
    } as any

    if (render && typeof render === 'function') {
      options.render = render
    }

    if (getItemValue && typeof getItemValue === 'function') {
      options.getItemValue = getItemValue
    }

    this.geocoder = new MapboxGeocoder(options)
    this.subscribeEvents()

    if (containerNode) {
      containerNode.appendChild(this.geocoder.onAdd(mapboxMap))
    } else {
      mapboxMap.addControl(
        this.geocoder,
        VALID_POSITIONS.find(_position => position === _position)
      )
    }

    if (inputValue !== undefined && inputValue !== null) {
      this.geocoder.setInput(inputValue)
    } else if (this.cachedResult) {
      this.geocoder.setInput(this.cachedResult.place_name)
    }

    if (this.cachedResult || (inputValue !== undefined && inputValue !== null)) {
      this.showClearIcon()
    }

    onInit(this.geocoder)
  }

  showClearIcon = () => {
    // this is a hack to force clear icon to show if there is text in the input
    this.geocoder._clearEl.style.display = 'block'
  }

  getMapboxMap = () => {
    const { mapRef } = this.props

    return (mapRef && mapRef.current && mapRef.current.getMap()) || null
  }

  getContainerNode = () => {
    const { containerRef } = this.props

    return (containerRef && containerRef.current) || null
  }

  subscribeEvents = () => {
    this.geocoder.on('clear', this.handleClear)
    this.geocoder.on('loading', this.handleLoading)
    this.geocoder.on('results', this.handleResults)
    this.geocoder.on('result', this.handleResult)
    this.geocoder.on('error', this.handleError)
  }

  unsubscribeEvents = () => {
    this.geocoder.off('clear', this.handleClear)
    this.geocoder.off('loading', this.handleLoading)
    this.geocoder.off('results', this.handleResults)
    this.geocoder.off('result', this.handleResult)
    this.geocoder.off('error', this.handleError)
  }

  removeGeocoder = () => {
    const mapboxMap = this.getMapboxMap()

    this.unsubscribeEvents()

    if (mapboxMap && mapboxMap.removeControl) {
      this.getMapboxMap().removeControl(this.geocoder)
    }

    this.geocoder = null
  }

  handleClear = () => {
    this.cachedResult = null
    this.props.onClear()
  }

  handleLoading = event => {
    this.props.onLoading(event)
  }

  handleResults = event => {
    this.props.onResults(event)
  }

  handleResult = event => {
    const { result } = event
    const { onViewportChange, onResult } = this.props
    const { bbox, center, properties = {} } = result
    const { short_code } = properties
    const [longitude, latitude] = center
    const bboxExceptions = {
      fr: {
        name: 'France',
        bbox: [
          [-4.59235, 41.380007],
          [9.560016, 51.148506]
        ]
      },
      us: {
        name: 'United States',
        bbox: [
          [-171.791111, 18.91619],
          [-66.96466, 71.357764]
        ]
      },
      ru: {
        name: 'Russia',
        bbox: [
          [19.66064, 41.151416],
          [190.10042, 81.2504]
        ]
      },
      ca: {
        name: 'Canada',
        bbox: [
          [-140.99778, 41.675105],
          [-52.648099, 83.23324]
        ]
      }
    }
    const { width, height } = this.getMapboxMap()
      .getContainer()
      .getBoundingClientRect()
    let zoom = this.geocoder.options.zoom
    const fitBounds = (bounds, viewport) => new WebMercatorViewport(viewport).fitBounds(bounds)

    try {
      if (!bboxExceptions[short_code] && bbox) {
        zoom = fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
          ],
          { width, height }
        ).zoom
      } else if (bboxExceptions[short_code]) {
        zoom = fitBounds(bboxExceptions[short_code].bbox, { width, height }).zoom
      }
    } catch (e) {
      console.warn('following result caused an error when trying to zoom to bbox: ', result) // eslint-disable-line
      zoom = this.geocoder.options.zoom
    }

    onViewportChange({
      longitude,
      latitude,
      zoom,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: 3000
    })
    onResult(event)

    this.cachedResult = result
    this.geocoder._typeahead.selected = null
    this.showClearIcon()
  }

  handleError = event => {
    this.props.onError(event)
  }

  getGeocoder() {
    return this.geocoder
  }

  render() {
    return null
  }

  static defaultProps = {
    onViewportChange: emptyFunction,
    origin: 'https://api.mapbox.com',
    zoom: 16,
    placeholder: 'Search',
    trackProximity: false,
    collapsed: false,
    clearAndBlurOnEsc: false,
    clearOnBlur: false,
    minLength: 2,
    limit: 5,
    reverseGeocode: false,
    enableEventLogging: true,
    position: 'top-right',
    onInit: emptyFunction,
    onClear: emptyFunction,
    onLoading: emptyFunction,
    onResults: emptyFunction,
    onResult: emptyFunction,
    onError: emptyFunction
  }
}

export default Geocoder
