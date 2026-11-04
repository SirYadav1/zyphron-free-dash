import { defineStore } from 'pinia'
import client from '../api/client'

/**
 * White-label branding — single client-side source of truth.
 * Backend /branding (public) resolves: admin setting brand_name -> env BRAND_NAME -> default.
 * Cached in localStorage so the login page paints instantly; refreshed on every boot.
 */
export const useBrandingStore = defineStore('branding', {
  state: () => ({
    name: localStorage.getItem('brand_name') || 'Zyphron Cloud',
    loginImage: localStorage.getItem('brand_login_image') || '',
    favicon: localStorage.getItem('brand_favicon') || '',
    loaded: false,
  }),
  actions: {
    async load() {
      try {
        const { data } = await client.get('/branding')
        if (data?.name) {
          this.name = data.name
          localStorage.setItem('brand_name', data.name)
        }
        if (data?.login_image_url) {
          this.loginImage = data.login_image_url
          localStorage.setItem('brand_login_image', data.login_image_url)
        }
        if (data?.favicon_url) {
          this.favicon = data.favicon_url
          localStorage.setItem('brand_favicon', data.favicon_url)
        }
      } catch {
        // offline/API error — keep cached values, never break the app
      } finally {
        this.loaded = true
        document.title = `${this.name} — Client Area`
      }
    },
  },
})
