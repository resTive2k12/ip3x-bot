import Datastore from 'nedb';
import { User } from '../bot/api/storage';

export class UserService {
  private store: Datastore;

  constructor(fileName: string, autoLoad = true) {
    this.store = new Datastore({
      filename: fileName,
      autoload: autoLoad
    });
  }

  public getInstance(): Datastore {
    return this.store;
  }

  public fetch(id: string): Promise<User> {
    return new Promise<User>((resolve, reject): void => {
      if (!this.store) reject('Database instance not loaded...');
      this.store.findOne<User>({ _id: id }, (err, document) => {
        if (err) {
          reject(err);
        }
        if (!document) {
          const error = new Error();
          error.message = `could not find document with id "${id}".`;
          error.name = 'ID not found';
          reject(error);
        }
        resolve(document);
      });
    });
  }

  public updateOrInsert(entry: User): Promise<User> {
    return new Promise<User>((resolve, reject): void => {
      if (!this.store) reject('Database instance not loaded...');
      this.store.update({ _id: entry._id }, entry, { upsert: true }, (err, numRows) => {
        if (err) reject(err);
        else if (numRows < 1) reject(new Error('No data has been updated'));
        else resolve(entry);
      });
    });
  }

  public update(entry: User): Promise<User> {
    return new Promise<User>((resolve, reject): void => {
      if (!this.store) reject('Database instance not loaded...');
      this.store.update({ _id: entry._id }, entry, {}, (err, numRows) => {
        if (err) reject(err);
        else if (numRows < 1) reject(new Error('No data has been updated'));
        else resolve(entry);
      });
    });
  }

  public insert(entry: User): Promise<User> {
    return new Promise<User>((resolve, reject): void => {
      if (!this.store) reject('Database instance not loaded...');
      this.store.insert(entry, (err, newdoc) => {
        if (err) reject(err);
        else resolve(newdoc);
      });
    });
  }

  public compact(): void {
    this.store.persistence.compactDatafile();
  }
}
