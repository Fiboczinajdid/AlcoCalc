import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { app } from './state/app.svelte';

app.init();

export default mount(App, { target: document.getElementById('app')! });
