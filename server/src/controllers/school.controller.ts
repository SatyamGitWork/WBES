import { Request, Response } from 'express';
import { Class } from '../models/Class.model';
import { Subject } from '../models/Subject.model';

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find().sort({ name: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, section } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Class name is required' });
      return;
    }
    const newClass = await Class.create({ name, section });
    res.status(201).json(newClass);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Class and section combination already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, section } = req.body;
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { name, section: section || undefined },
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(updatedClass);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Class and section combination already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedClass = await Class.findByIdAndDelete(id);
    if (!deletedClass) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Subject name and code are required' });
      return;
    }
    const newSubject = await Subject.create({ name, code });
    res.status(201).json(newSubject);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subject code already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { name, code },
      { new: true, runValidators: true }
    );
    if (!updatedSubject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    res.json(updatedSubject);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subject code already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedSubject = await Subject.findByIdAndDelete(id);
    if (!deletedSubject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
