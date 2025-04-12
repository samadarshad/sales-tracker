import { app } from './firebase';
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

import { GithubAuthProvider } from "firebase/auth";

const provider = new GithubAuthProvider();