"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google");
}

/**
 * For a sign-in prompt bound to a specific destination via
 * `signInWithGoogleTo.bind(null, "/some/path")` — kept separate from
 * signInWithGoogle (rather than an optional param on it) because a plain
 * `<form action={signInWithGoogle}>` is called with the form's FormData as
 * its first argument, which an optional string param would silently
 * swallow as "redirectTo".
 */
export async function signInWithGoogleTo(redirectTo: string, _formData: FormData) {
  await signIn("google", { redirectTo });
}

export async function signOutAction() {
  await signOut();
}
