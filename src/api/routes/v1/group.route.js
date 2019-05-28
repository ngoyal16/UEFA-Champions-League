const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/group.controller');

const router = express.Router();

router
  .route('/')
  /**
   * @api {get} v1/groups List Group
   * @apiDescription Get a list of Groups
   * @apiVersion 1.0.0
   * @apiName listGroups
   * @apiGroup User
   *
   *
   * @apiSuccess {Object[]} groups List of Groups.
   */
  .get(controller.list)
  
module.exports = router;
