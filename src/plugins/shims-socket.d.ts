import Vue from 'vue'
import {SocketConnection} from '../socket';

declare module 'vue/types/vue' {
  interface Vue {
    $socket: SocketConnection
  }
}