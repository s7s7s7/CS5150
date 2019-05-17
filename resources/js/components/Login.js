import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import GoogleLogin from 'react-google-login';
import { GoogleLogout } from 'react-google-login';
import { LoginContext } from './App';

class Login extends React.Component {
  constructor(props) {
    super(props);
    let temp = window.sessionStorage.getItem("value");
    let login;
    if(temp == "logged"){
      login = true;
    }else{
      login = false;
    }
    console.log(login);
    this.state = {
      permision: "read",
      user: null,
      login: login,
    };
    this.loginSuccess = this.loginSuccess.bind(this);
    this.loginError = this.loginError.bind(this);
    this.logoutResponse = this.logoutResponse.bind(this);
  }

  loginSuccess(response) {
    console.log(response);
    window.sessionStorage.setItem("value","logged");
    window.location.reload(false);
  }

  loginError(response) {
    
    window.sessionStorage.setItem("value","unlogged");
    console.log(response);
  }

  logoutResponse(response) {
    console.log("adfadfadf");
    window.sessionStorage.setItem("value","unlogged");
    console.log("You are logged out");
    window.location.reload(false);
  }

  renderButton() {
    var toreturn = (
      !this.state.login
        ? <div id='login-button'>
          <GoogleLogin
            clientId="795086897508-p73emkkcd287sf6e4nm8jgb45susbcg1.apps.googleusercontent.com"
            buttonText="Login With Google"
            onSuccess={response => this.loginSuccess(response)}
            onFailure={response => this.loginError(response)}
            cookiePolicy={'single_host_origin'}
          />
        </div>
        : <div id='logout-button'>
          <GoogleLogout
            clientId="795086897508-p73emkkcd287sf6e4nm8jgb45susbcg1.apps.googleusercontent.com"
            buttonText="Logout"
            onLogoutSuccess={response => this.logoutResponse(response)}
          >
          </GoogleLogout>
        </div>
    )
    console.log(toreturn);
    return toreturn;
  }

  render() {
    return (
      <div>
        {!this.state.login
            ? <div id='login-button'>
              <GoogleLogin
                clientId="795086897508-p73emkkcd287sf6e4nm8jgb45susbcg1.apps.googleusercontent.com"
                buttonText="Login With Google"
                onSuccess={this.loginSuccess}
                onFailure={this.loginError}
                cookiePolicy={'single_host_origin'}
              />
            </div>
            : <div id='logout-button'>
              <GoogleLogout
                clientId="795086897508-p73emkkcd287sf6e4nm8jgb45susbcg1.apps.googleusercontent.com"
                buttonText="Logout"
                onLogoutSuccess={this.logoutResponse}
              >
              </GoogleLogout>
            </div>
          }
      </div>
    );
  }
}

export default Login

// if (document.getElementById('login')) {
// 	ReactDOM.render(<Login />, document.getElementById('Login'));
// }
