import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { app } from './state/app.svelte';
import { initUpdates } from './updates';

app.init();
initUpdates();

export default mount(App, { target: document.getElementById('app')! });
