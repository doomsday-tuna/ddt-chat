import React, { Component } from 'react'
import * as Sentry from '@sentry/browser'
import styled from 'styled-components'

const Base = styled.section`
  max-width: 520px;
  padding: 1em;
  margin: auto;
`

export default class ErrorBoundary extends Component {
  state = { error: null }

  componentDidCatch(error, errorInfo) {
    this.setState({ error })
    Sentry.configureScope(scope => {
      Object.keys(errorInfo).forEach(key => {
        scope.setExtra(key, errorInfo[key])
      })
    })
    Sentry.captureException(error)
  }

  render() {
    if (this.state.error) {
      return (
        <Base>
          <h2>Opps!</h2>
          <p>Looks like we ran into an issue.</p>
          <p>
            Could you{' '}
            <a onClick={() => Sentry.showReportDialog()}>tell us a bit more</a>{' '}
            about what you were doing when this happened?
          </p>
          {this.props.nextAction}
        </Base>
      )
    } else {
      return this.props.children
    }
  }
}
