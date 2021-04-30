const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require("dotenv").config();
const uri = process.env.MONGO_CONNECTION_STRING;

class NotesDataAccess {
  client = null;

  async connect() {
    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await this.client.connect();
    const db = this.client.db('notesapp');
    const collection = db.collection('notes');
    return collection;
  }

  async getNotes(searchText) {
    const collection = await this.connect();
    let result = [];
    try {
      const filter = searchText ? {title: {$regex: '^' + searchText}} : null;
      const cursor = collection.find(filter);
      result = await cursor.toArray();
    } catch (err) {
      this.handleError('getNotes', err);
    } finally {
      this.disconnect();
    }

    return result;
  }

  async getNoteById(id) {
    const collection = await this.connect();
    let result = null;
    try {
      const filter = {id: new ObjectID(id)};
      result = await collection.findOne(filter);
    } catch (err) {
      this.handleError('getNoteById', err);
    } finally {
      this.disconnect();
    }

    return result;
  }

  async insertNote(body, title) {
    const collection = await this.connect();
    const id = new ObjectID();
    const now = new Date();
    let result = null;
    try {
      const note = {
        _id: id,
        id: id,
        body,
        title,
        created_at: now,
        updated_at: now,
      };
      const res = await collection.insertOne(note);
      result = res.insertedId;
    } catch (err) {
      this.handleError('insertNote', err);
    } finally {
      this.disconnect();
    }

    return result;
  }

  async updateNote(id, body, title) {
    const collection = await this.connect();
    let updatedId = null;
    try {
      const filter = {id: new ObjectID(id)};
      const updated_at = new Date();
      const updateDocument = {
        $set: {body, title, updated_at},
      };
      const result = await collection.updateOne(filter, updateDocument);
      updatedId = result.upsertedId;
    } catch (err) {
      this.handleError('updateNote', err);
    } finally {
      this.disconnect();
    }

    return updatedId;
  }

  async deleteNote(id) {
    const collection = await this.connect();
    try {
      const filter = {id: new ObjectID(id)};
      await collection.deleteOne(filter);
    } catch (err) {
      this.handleError('deleteNote', err);
    } finally {
      this.disconnect();
    }
  }

  handleError(message, err) {
    console.log(message, err);
  }

  disconnect() {
    this.client.close();
    this.client = null;
  }
}

module.exports = NotesDataAccess;
