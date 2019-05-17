import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Header from './Header'


class Projects extends Component {
    render() {
        return (
            <BrowserRouter>
                <div>
                    <Header />
                </div>
                <div> Hello </div>
            </BrowserRouter>
        )
    }
}

ReactDOM.render(<Projects />, document.getElementById('projects'))
