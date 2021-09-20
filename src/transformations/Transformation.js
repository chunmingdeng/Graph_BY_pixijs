/**
 * The transformation types the graphz support.
 * @static
 * @constant
 * @name TRANSFORMATION_TYPES
 * @type {{NODE_GROUPING: number, EDGE_GROUPING: number}}
 */
export const TRANSFORMATION_TYPES = {
  NODE_GROUPING:  0,
  EDGE_GROUPING:  1,
};

export default class Transformation {
  constructor(type, options) {
    this.options = options;
  }

  /**
   * Remove the transformation over the specified amount of time.
   * @param duration {number} -- Animation duration in ms
   * @returns {Promise<void>}
   */
  async destroy(duration = 0) {

  }

  /**
   * Disable the transformation over the specified amount of time.
   * @param duration {number} -- Animation duration in ms
   * @returns {Promise<void>}
   */
  async disable(duration = 0) {

  }

  /**
   * Enable the transformation over the specified amount of time.
   * @param duration {number} -- Animation duration in ms
   * @returns {Promise<void>}
   */
  async enable(duration = 0) {

  }

  /**
   * Returns the id of the transformation, a unique strictly positive integer.
   * @returns id {number}
   */
  getId() {

  }

  /**
   * Retrieves the index of the transformation in the pipeline.
   * @returns index {number}
   */
  getIndex() {

  }

  /**
   * Returns the name of the transformation.
   * @returns name {string} -- "node-filter"|"edge-filter"|"node-grouping"|"edge-grouping"
   */
  getName() {

  }

  /**
   * Indicates if the transformation is enabled
   * @returns boolean
   */
  isEnabled() {

  }

  /**
   * Refresh the transformation.
   * @returns {Promise<void>}
   */
  async refresh() {

  }

  /**
   * Set the index of the transformation in the pipeline.
   * The transformation with the lower index is applied first,
   * the one with the higher index is applied last.
   * @param index
   * @returns {Promise<void>}
   */
  async setIndex(index) {

  }

  /**
   * Toggle the transformation over the specified amount of time.
   * @param duration {number} -- Animation duration in ms
   * @returns {Promise<void>}
   */
  async toggle(duration = 0) {

  }

  /**
   * Returns a Promise that resolves the first time the transformation is applied.
   * @returns {Promise<void>}
   */
  async whenApplied() {

  }
}
