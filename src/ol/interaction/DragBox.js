/**
 * @module ol/interaction/DragBox
 */
// FIXME draw drag box
import Event from '../events/Event.js';
import {mouseActionButton} from '../events/condition.js';
import RenderBox from '../render/Box.js';
import PointerInteraction from './Pointer.js';

/**
 * A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and two
 * {@link module:ol/pixel~Pixel}s and returns a `{boolean}`. If the condition is met,
 * true should be returned.
 * @typedef {function(this: ?, import("../MapBrowserEvent.js").default, import("../pixel.js").Pixel, import("../pixel.js").Pixel):boolean} EndCondition
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-dragbox'] CSS class name for styling the box.
 * @property {import("../events/condition.js").Condition} [condition] A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol/events/condition~mouseActionButton}.
 * @property {number} [minArea=64] The minimum area of the box in pixel, this value is used by the default
 * `boxEndCondition` function.
 * @property {EndCondition} [boxEndCondition] A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and two
 * {@link module:ol/pixel~Pixel}s to indicate whether a `boxend` event should be fired.
 * Default is `true` if the area of the box is bigger than the `minArea` option.
 * @property {function(this:DragBox, import("../MapBrowserEvent.js").default):void} [onBoxEnd] Code to execute just
 * before `boxend` is fired.
 */

/**
 * @enum {string}
 */
const DragBoxEventType = {
  /**
   * Triggered upon drag box start.
   * @event DragBoxEvent#boxstart
   * @api
   */
  BOXSTART: 'boxstart',

  /**
   * Triggered on drag when box is active.
   * @event DragBoxEvent#boxdrag
   * @api
   */
  BOXDRAG: 'boxdrag',

  /**
   * Triggered upon drag box end.
   * @event DragBoxEvent#boxend
   * @api
   */
  BOXEND: 'boxend',

  /**
   * Triggered upon drag box canceled.
   * @event DragBoxEvent#boxcancel
   * @api
   */
  BOXCANCEL: 'boxcancel',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/DragBox~DragBox} instances are instances of
 * this type.
 */
export class DragBoxEvent extends Event {
  /**
   * @param {string} type The event type.
   * @param {import("../coordinate.js").Coordinate} coordinate The event coordinate.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Originating event.
   */
  constructor(type, coordinate, mapBrowserEvent) {
    super(type);

    /**
     * The coordinate of the drag event.
     * @const
     * @type {import("../coordinate.js").Coordinate}
     * @api
     */
    this.coordinate = coordinate;

    /**
     * @const
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent;
  }
}

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'boxcancel'|'boxdrag'|'boxend'|'boxstart', DragBoxEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'boxcancel'|'boxdrag'|'boxend', Return>} DragBoxOnSignature
 */

/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map,
 * normally combined with a {@link module:ol/events/condition} that limits
 * it to when the shift or other key is held down. This is used, for example,
 * for zooming to a specific area of the map
 * (see {@link module:ol/interaction/DragZoom~DragZoom} and
 * {@link module:ol/interaction/DragRotateAndZoom~DragRotateAndZoom}).
 *
 * @fires DragBoxEvent
 * @api
 */
class DragBox extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    /***
     * @type {DragBoxOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {DragBoxOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {DragBoxOnSignature<void>}
     */
    this.un;

    options = options ?? {};

    /**
     * @type {import("../render/Box.js").default}
     * @private
     */
    this.box_ = new RenderBox(options.className || 'ol-dragbox');

    /**
     * @type {number}
     * @private
     */
    this.minArea_ = options.minArea ?? 64;

    if (options.onBoxEnd) {
      this.onBoxEnd = options.onBoxEnd;
    }

    /**
     * @type {import("../pixel.js").Pixel}
     * @private
     */
    this.startPixel_ = null;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ?? mouseActionButton;

    /**
     * @private
     * @type {EndCondition}
     */
    this.boxEndCondition_ =
      options.boxEndCondition ?? this.defaultBoxEndCondition;
  }

  /**
   * The default condition for determining whether the boxend event
   * should fire.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent The originating MapBrowserEvent
   *     leading to the box end.
   * @param {import("../pixel.js").Pixel} startPixel The starting pixel of the box.
   * @param {import("../pixel.js").Pixel} endPixel The end pixel of the box.
   * @return {boolean} Whether or not the boxend condition should be fired.
   */
  defaultBoxEndCondition(mapBrowserEvent, startPixel, endPixel) {
    const width = endPixel[0] - startPixel[0];
    const height = endPixel[1] - startPixel[1];
    return width * width + height * height >= this.minArea_;
  }

  /**
   * Returns geometry of last drawn box.
   * @return {import("../geom/Polygon.js").default} Geometry.
   * @api
   */
  getGeometry() {
    return this.box_.getGeometry();
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @override
   */
  handleDragEvent(mapBrowserEvent) {
    if (!this.startPixel_) {
      return;
    }

    this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);

    this.dispatchEvent(
      new DragBoxEvent(
        DragBoxEventType.BOXDRAG,
        mapBrowserEvent.coordinate,
        mapBrowserEvent,
      ),
    );
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleUpEvent(mapBrowserEvent) {
    if (!this.startPixel_) {
      return false;
    }

    const completeBox = this.boxEndCondition_(
      mapBrowserEvent,
      this.startPixel_,
      mapBrowserEvent.pixel,
    );
    if (completeBox) {
      this.onBoxEnd(mapBrowserEvent);
    }
    this.dispatchEvent(
      new DragBoxEvent(
        completeBox ? DragBoxEventType.BOXEND : DragBoxEventType.BOXCANCEL,
        mapBrowserEvent.coordinate,
        mapBrowserEvent,
      ),
    );

    this.box_.setMap(null);
    this.startPixel_ = null;

    return false;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleDownEvent(mapBrowserEvent) {
    if (this.condition_(mapBrowserEvent)) {
      this.startPixel_ = mapBrowserEvent.pixel;
      this.box_.setMap(mapBrowserEvent.map);
      this.box_.setPixels(this.startPixel_, this.startPixel_);
      this.dispatchEvent(
        new DragBoxEvent(
          DragBoxEventType.BOXSTART,
          mapBrowserEvent.coordinate,
          mapBrowserEvent,
        ),
      );
      return true;
    }
    return false;
  }

  /**
   * Function to execute just before `onboxend` is fired
   * @param {import("../MapBrowserEvent.js").default} event Event.
   */
  onBoxEnd(event) {}

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   * @override
   */
  setActive(active) {
    if (!active) {
      this.box_.setMap(null);
      if (this.startPixel_) {
        this.dispatchEvent(
          new DragBoxEvent(DragBoxEventType.BOXCANCEL, this.startPixel_, null),
        );
        this.startPixel_ = null;
      }
    }

    super.setActive(active);
  }

  /**
   * @param {import("../Map.js").default|null} map Map.
   * @override
   */
  setMap(map) {
    const oldMap = this.getMap();

    if (oldMap) {
      this.box_.setMap(null);

      if (this.startPixel_) {
        this.dispatchEvent(
          new DragBoxEvent(DragBoxEventType.BOXCANCEL, this.startPixel_, null),
        );
        this.startPixel_ = null;
      }
    }

    super.setMap(map);
  }
}

export default DragBox;
