import Service from '@ember/service';
import {  AuthChangeEvent, AuthSession, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getOwner } from '@ember/application';
import type ApplicationInstance from '@ember/application/instance';
import type Config from 'dummy/tests/dummy/app/config/environment';

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}

export default class SupabaseService extends Service {
  client: SupabaseClient;
  _session: AuthSession | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    super(...args);

    const config = (getOwner(this) as ApplicationInstance).resolveRegistration(
      'config:environment'
    );
    const { url, key } = (config as typeof Config).supabase;

    // Create a single supabase client for interacting with your database
    const supabase = createClient(url, key);

    this.client = supabase;
  }

  async restoreSession() {
    this.client.auth.getSession().then(({ data }) => {
      this._session = data.session
    })
    return this._session
  }

  async authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback)
  }

  async profile(user: User) {
    return this.client
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single()
  }

  async login(email: string) {
    return this.client.auth.signInWithOtp({
      email: email
    });
  }

  async logout() {
    await this.client.auth.signOut();
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return this.client.from('profiles').upsert(update)
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    supabase: SupabaseService;
  }
}
