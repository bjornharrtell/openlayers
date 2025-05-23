import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  transition: 0,
  sources: [{url: '/data/raster/elevation-f32.tif'}],
});

new Map({
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  target: 'map',
  view: source.getView(),
});

render({
  message: 'normalize i16 data with nan nodata based on GDAL stats',
});
