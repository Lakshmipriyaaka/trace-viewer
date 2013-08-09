// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

base.require('base.utils');
base.require('ui.animation');

base.exportTo('tracing', function() {
  var kDefaultPanAnimatoinDurationMs = 100.0;

  /**
   * Pans a TimelineDisplayTransform by a given amount.
   * @constructor
   * @extends {ui.Animation}
   * @param {Number} deltaX The total amount of change to the transform's panX.
   * @param {Number} deltaY The total amount of change to the transform's panY.
   * @param {Number=} opt_durationMs How long the pan animation should run.
   * Defaults to kDefaultPanAnimatoinDurationMs.
   */
  function TimelineDisplayTransformPanAnimation(
      deltaX, deltaY, opt_durationMs) {
    if (opt_durationMs === undefined)
      this.durationMs = kDefaultPanAnimatoinDurationMs;
    else
      this.durationMs = opt_durationMs;

    this.deltaX = deltaX;
    this.deltaY = deltaY;

    this.startPanX = undefined;
    this.startPanY = undefined;
    this.startTimeMs = undefined;
  }

  TimelineDisplayTransformPanAnimation.prototype = {
    __proto__: ui.Animation.prototype,

    canTakeOverFor: function(existingAnimation) {
      return existingAnimation instanceof TimelineDisplayTransformPanAnimation;
    },

    takeOverFor: function(existing, timestamp, target) {
      var remainingDeltaXOnExisting = existing.goalPanX - target.panX;
      var remainingDeltaYOnExisting = existing.goalPanY - target.panY;
      var remainingTimeOnExisting = timestamp - (
          existing.startTimeMs + existing.durationMs);
      remainingTimeOnExisting = Math.max(remainingTimeOnExisting, 0);

      this.deltaX += remainingDeltaXOnExisting;
      this.deltaY += remainingDeltaYOnExisting;
      this.durationMs += remainingTimeOnExisting;
    },

    start: function(timestamp, target) {
      this.startTimeMs = timestamp;
      this.startPanX = target.panX;
      this.startPanY = target.panY;
    },

    tick: function(timestamp, target) {
      var percentDone = (timestamp - this.startTimeMs) / this.durationMs;
      percentDone = base.clamp(percentDone, 0, 1);

      target.panX = base.lerp(percentDone, this.startPanX, this.goalPanX);
      target.panY = base.lerp(percentDone, this.startPanY, this.goalPanY);
      return timestamp >= this.startTimeMs + this.durationMs;
    },

    get goalPanX() {
      return this.startPanX + this.deltaX;
    },

    get goalPanY() {
      return this.startPanY + this.deltaY;
    }
  };

  /**
   * Zooms in/out on a specified location in the world.
   *
   * Zooming in and out is all about keeping the area under the mouse cursor,
   * here called the "focal point" in the same place under the zoom. If one
   * simply changes the scale, the area under the mouse cursor will change. To
   * keep the focal point from moving during the zoom, the pan needs to change
   * in order to compensate. Thus, a ZoomTo animation is given both a focal
   * point in addition to the amount by which to zoom.
   *
   * @constructor
   * @extends {ui.Animation}
   * @param {Number} goalFocalPointXWorld The X coordinate in the world which is
   * of interest.
   * @param {Number} goalFocalPointXView Where on the screen the
   * goalFocalPointXWorld should stay centered during the zoom.
   * @param {Number} goalFocalPointY Where the panY should be when the zoom
   * completes.
   * @param {Number} zoomInRatioX The ratio of the current scaleX to the goal
   * scaleX.
   */
  function TimelineDisplayTransformZoomToAnimation(
      goalFocalPointXWorld,
      goalFocalPointXView,
      goalFocalPointY,
      zoomInRatioX) {
    this.goalFocalPointXWorld = goalFocalPointXWorld;
    this.goalFocalPointXView = goalFocalPointXView;
    this.goalFocalPointY = goalFocalPointY;
    this.zoomInRatioX = zoomInRatioX;

    this.goalScaleX = undefined;
  }

  TimelineDisplayTransformZoomToAnimation.prototype = {
    __proto__: ui.Animation.prototype,

    canTakeOverFor: function(existingAnimation) {
      return false;
    },

    takeOverFor: function(existingAnimation, timestamp, target) {
      throw new Error('Should not be called');
    },

    start: function(timestamp, target) {
      this.goalScaleX = this.zoomInRatioX * target.scaleX;
    },

    tick: function(timestamp, target) {
      target.scaleX = this.goalScaleX;
      target.xPanWorldPosToViewPos(
          this.goalFocalPointXWorld, this.goalFocalPointXView);
      target.panY = this.goalFocalPointY;
      return true;
    }
  };

  return {
    TimelineDisplayTransformPanAnimation:
        TimelineDisplayTransformPanAnimation,
    TimelineDisplayTransformZoomToAnimation:
        TimelineDisplayTransformZoomToAnimation
  };
});