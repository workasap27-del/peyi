declare module '*.geojson' {
  import type { FeatureCollection } from 'geojson'
  const value: FeatureCollection
  export default value
}

declare module '*communes-971.json' {
  import type { FeatureCollection } from 'geojson'
  const value: FeatureCollection
  export default value
}
