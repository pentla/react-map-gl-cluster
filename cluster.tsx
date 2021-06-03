import React, { useEffect, useState, useCallback, Children, createElement } from 'react'
import { point, BBox } from '@turf/helpers'
import { Marker } from 'react-map-gl'
import Mapbox from 'mapbox-gl'
import Supercluster from 'supercluster'


type Props = {
  /** Mapbox map object */
  map: Mapbox.Map

  /** Minimum zoom level at which clusters are generated */
  minZoom?: number

  /** Maximum zoom level at which clusters are generated */
  maxZoom?: number

  /** Cluster radius, in pixels */
  radius?: number

  /** (Tiles) Tile extent. Radius is calculated relative to this value */
  extent?: number

  /** Size of the KD-tree leaf node. Affects performance */
  nodeSize?: number

  /** ReactDOM element to use as a marker */
  element?: (cluster: ClusterProps) => React.ReactNode

  innerRef?: React.MutableRefObject<any>

  /** Markers as children */
  children?: React.ReactNode
}

type ClusterProps = {
  cluster: Supercluster
  clusterId: number
  latitude: number
  longitude: number
  pointCount: number
  pointCountAbbreviated: number
}

let clusterObject: Supercluster = null

const useCluster = ({ minZoom, maxZoom, radius, extent, nodeSize, map, children }: Props) => {
  const [clusters, setClusters] = useState([])

  const createCluster = useCallback(() => {
    const cluster = new Supercluster({
      minZoom,
      maxZoom,
      radius,
      extent,
      nodeSize
    })

    const points = Children.map(children, (child: React.ReactElement) => {
      if (child) return point([child.props.longitude, child.props.latitude], child)
      return null
    })

    cluster.load(points)
    clusterObject = cluster
  }, [children, extent, maxZoom, minZoom, nodeSize, radius])

  const recalculate = useCallback(() => {
    if (!clusterObject) return
    const zoom = map.getZoom()
    const bounds = map.getBounds().toArray()
    const bbox = bounds[0].concat(bounds[1]) as BBox
    const clusters = clusterObject.getClusters(bbox, Math.floor(zoom))
    setClusters(clusters)
    // eslint-disable-next-line
  }, [children])

  useEffect(() => {
    createCluster()
    recalculate()

    // eslint-disable-next-line
  }, [map, recalculate, createCluster])

  return { clusterObject, clusters }
}

const Cluster: React.FC<Props> = ({
  minZoom = 0,
  maxZoom = 16,
  radius = 40,
  extent = 512,
  nodeSize = 64,
  map,
  children,
  element
}) => {
  const { clusterObject, clusters } = useCluster({ minZoom, maxZoom, radius, extent, nodeSize, map, children })

  return (
    <>
      {clusters.map(cluster => {
        if (cluster.properties.cluster) {
          const [longitude, latitude] = cluster.geometry.coordinates
          return (
            <Marker
              longitude={longitude}
              latitude={latitude}
              offsetLeft={-28 / 2}
              offsetTop={-28}
              key={`cluster-${cluster.properties.cluster_id}`}
            >
              {element({
                latitude,
                longitude,
                cluster: clusterObject,
                clusterId: cluster.properties.cluster_id,
                pointCount: cluster.properties.point_count,
                pointCountAbbreviated: cluster.properties.point_count_abbreviated
              })}
            </Marker>
          )
        }
        const { type, key, props } = cluster.properties
        return createElement(type, { key, ...props })
      })}
    </>
  )
}

export default Cluster
