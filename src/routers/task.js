const express = require('express');
const Task = require('../models/task');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    await task.save(task);
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send();
  }
});
// GET /tasks?completed=true
// GET /tasks?limit=2&skip=1
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};
    if (req.query.completed) match.completed = req.query.completed === 'true';
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      if (parts[1] === 'desc') sort[parts[0]] = -1;
      else if (parts[1] === 'asc') sort[parts[0]] = 1;
    }
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  if (!ObjectId.isValid(_id)) return res.status(400).send();
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) return res.status(404).send();
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).send();

  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidUpdates = updates.every(prop => allowedUpdates.includes(prop));
  if (!isValidUpdates) return res.status(400).send({ error: 'Invalid update' });

  try {
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).send();

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) res.status(400).send();

  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) res.status(404).send();
    res.send(task);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
