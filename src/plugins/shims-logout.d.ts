import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $logout: (oneSided: boolean) => Promise<any>
  }
}