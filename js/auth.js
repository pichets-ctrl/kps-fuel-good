/**
 * KPS Fuel Good - Authentication Module
 */

const Auth = (() => {
  let currentUser = null;

  // Listen to auth state changes globally
  auth.onAuthStateChanged(async user => {
    currentUser = user;

    if (user) {
      // Upsert user document in Firestore
      try {
        await db.collection('users').doc(user.uid).set({
          uid:         user.uid,
          email:       user.email,
          displayName: user.displayName || '',
          photoURL:    user.photoURL    || '',
          updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error('Failed to upsert user:', e);
      }

      // Dispatch event so pages can react
      document.dispatchEvent(new CustomEvent('authChanged', { detail: { user } }));
      updateNavUI(user);
    } else {
      document.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
      updateNavUI(null);
    }
  });

  function updateNavUI(user) {
    const loginLinks  = document.querySelectorAll('[data-auth="login"]');
    const logoutLinks = document.querySelectorAll('[data-auth="logout"]');
    const userInfo    = document.querySelectorAll('[data-auth="userinfo"]');
    const authOnly    = document.querySelectorAll('[data-auth="required"]');

    if (user) {
      loginLinks.forEach(el  => el.classList.add('d-none'));
      logoutLinks.forEach(el => el.classList.remove('d-none'));
      authOnly.forEach(el    => el.classList.remove('d-none'));
      userInfo.forEach(el => {
        el.innerHTML = `
          <img src="${user.photoURL || 'img/default-avatar.svg'}"
               alt="${user.displayName}"
               style="width:32px;height:32px;border-radius:50%;border:2px solid var(--gold);object-fit:cover;">
          <span style="font-size:0.85rem;color:var(--text-light)">${user.displayName || user.email}</span>
        `;
        el.classList.remove('d-none');
      });
    } else {
      loginLinks.forEach(el  => el.classList.remove('d-none'));
      logoutLinks.forEach(el => el.classList.add('d-none'));
      authOnly.forEach(el    => el.classList.add('d-none'));
      userInfo.forEach(el    => el.classList.add('d-none'));
    }
  }

  async function signInWithGoogle() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  async function signOut() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  function requireAuth(redirectTo = 'login.html') {
    return new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        if (!user) {
          window.location.href = redirectTo +
            '?redirect=' + encodeURIComponent(window.location.href);
        } else {
          resolve(user);
        }
      });
    });
  }

  function getUser()    { return currentUser; }
  function isLoggedIn() { return !!currentUser; }

  return { signInWithGoogle, signOut, requireAuth, getUser, isLoggedIn };
})();
