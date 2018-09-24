import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/browser'
import './index.css'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import registerServiceWorker from './registerServiceWorker'

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
)
registerServiceWorker()
Sentry.init({
  dsn: 'https://cb267e5d4a0b49b99c2a9fdee75c2522@sentry.io/1287157',
})
