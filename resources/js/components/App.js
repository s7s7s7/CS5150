import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Header from './Header.js'
import Individual_resource_page from './individual_resource_page/individual_resource_page.js'
import Individual_project_page from './individual_project_page/individual_project_page.js'
import { BrowserRouter as Router, Route, Link, NavLink } from "react-router-dom";
import Projects_list_page from './projects_list_page/projects_list_page.js'
import Resource_list_page from './resource_list_page/resource_list_page.js'
import add_res_to_project from './add_resource_to_project_page/add_res_to_project.js';
import Login from './Login.js';
import './navStyle.css';
import logo from "./logo.jpg";
export const LoginContext = React.createContext();
//try context for login featrue

class App extends Component {

  constructor(props) {
    super(props);

    this.toggleValue = (logInfo) => {
      window.sessionStorage.setItem("value", logInfo);
      this.setState({ value: logInfo });
    }

    this.state = {
      value: "unlogged",
      toggleValue: this.toggleValue,
    }
    if (window.sessionStorage.getItem("value") == null || window.sessionStorage.getItem("value") == undefined) {
      window.sessionStorage.setItem("value", "unlogged");
      window.sessionStorage.setItem("toggleValue", this.toggleValue);
    }
  }

  render() {
    console.log(window.sessionStorage.getItem("a"));
    return (
      <Router>
        <div>
          <nav>
            <div className="navi">
              <img src={logo} />
              <NavLink className="tag" to="/projects_list" activeStyle={{ color: 'green' }}><span>Project List</span></NavLink>
              <NavLink className="tag" to="/resource/" activeStyle={{ color: 'green' }}><span>Resource List</span></NavLink>
              {/* b31b1b */}
              {/* <LoginContext.Provider value="asdf">
                <LoginContext.Consumer>{(context)=><p>{context}</p>}</LoginContext.Consumer>
              </LoginContext.Provider> */}
              <div className="loginButton">
                {/* <Login /> */}
              </div>
            </div>
          </nav>
          <Route path="/" exact component={Projects_list_page} />
          <Route path="/login" component={Login} />
          <Route path="/about/" component={About} />
          <Route path="/users/" component={Users} />
          <Route path="/resource/" component={Resource_list_page} />
          <Route
            path="/individual_resource/:resourceID"
            component={Individual_resource_page}
          />
          <Route
            path="/individual_project/:projectID"
            component={Individual_project_page}
          />
          <Route path="/projects_list/" component={Projects_list_page} />
          <Route path="/add_res_to_project/:projectID" component={add_res_to_project} />
        </div>
      </Router>
    );
  }
}

function Index() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}


export default App;

if (document.getElementById('app')) {
  ReactDOM.render(<App />, document.getElementById('app'));
}
