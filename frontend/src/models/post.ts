import Poll from "./poll";
import User from "./user";

export default class Post {
  id = 0;
  title = "";
  author = new User();
  isPublished = false;
  creationDate = new Date();
  editingDate = new Date();
  polls: Array<Poll> = [];
}
