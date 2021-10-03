// src/App.js

"use strict";

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
    Button,
    Collapse,
    Form,
    FormGroup,
    Input,
    Nav,
    Navbar,
    NavbarBrand,
    NavItem,
    NavLink
} from 'reactstrap';
import { Editor } from '@tinymce/tinymce-react';
import socketIOClient from "socket.io-client";

import './App.css';

let config = require("./config/db/config.json");

config.api_key = process.env.API_KEY || config.api_key;
config.azure_base_url = process.env.AZURE_BASE_URL || config.azure_base_url;

let dsn = config.azure_base_url;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

    if (process.env.REACT_APP_LOCAL === 'true') {
        dsn = "http://localhost:1337";
    }
}

const socket = socketIOClient(dsn);
const ID = '_' + Math.random().toString(36).substr(2, 9);

// console.log("dsn: " + dsn);
export class App extends Component {
    render() {
        return (
            <div className="App">
                <h1>Text editor baserad på React and TinyMCE</h1>
                <TinyEditor />
            </div>
        );
    }
}

function validate(email, password) {
    // true means invalid, so our conditions got reversed
    return {
        email: email.length === 0,
        password: password.length === 0
    };
}
class SignUpForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: "",
            touched: {
                email: false,
                password: false
            }
        };

        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.canBeSubmitted = this.canBeSubmitted.bind(this);
        this.loginUser = this.loginUser.bind(this);
    }

    handleEmailChange(evt) {
        this.setState({ email: evt.target.value });
    }

    handlePasswordChange(evt)  {
        this.setState({ password: evt.target.value });
    }

    handleBlur(field)  {
        console.log(field);
    }

    async handleSubmit(evt) {
        if (!this.canBeSubmitted()) {
            evt.preventDefault();
            return;
        }
        const { email, password } = this.state;

        console.log(evt.target.name);
        if (evt.target.name === 'login') {
            await this.loginUser(email, password)
                .then(() => {
                    console.log(`Logged in with email: ${email} password: ${password}`);
                })
                .catch(err => {
                    console.error(err);
                });
        } else {
            await this.registerUser(email, password)
                .then(() => {
                    console.log(`Signed up with email: ${email} password: ${password}`);
                    this.loginUser(email, password);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }

    canBeSubmitted() {
        const errors = validate(this.state.email, this.state.password);
        const isDisabled = Object.keys(errors).some(x => errors[x]);

        return !isDisabled;
    }

    async registerUser(email, password) {
        const data = {
            email: email,
            password: password,
            api_key: config.api_key
        };

        await fetch(`${dsn}/auth/register`, {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'PUT'
        })
            .then(function () {
                console.log("registered");
            })
            .catch((err) => {
                console.log(err);
            });
    }

    async loginUser(email, password) {
        let that = this;
        const data = {
            email: email,
            password: password,
            api_key: config.api_key
        };

        // console.log("data: ");
        // console.log(JSON.stringify(data));
        await fetch(`${dsn}/auth/login`, {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (res) {
                // console.log(res.data.token);
                that.props.updateToken(res.data.token);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    render() {
        const errors = validate(this.state.email, this.state.password);
        const isDisabled = Object.keys(errors).some(x => errors[x]);
        const shouldMarkError = field => {
            const hasError = errors[field];
            const shouldShow = this.state.touched[field];

            return hasError ? shouldShow : false;
        };

        return (
            <div className="form">
                <label>
                    E-post:
                </label>
                <input
                    className={shouldMarkError("email") ? "error" : ""}
                    type="text"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                />
                <label>
                    Lösenord:
                </label>
                <input
                    className={shouldMarkError("password") ? "error" : ""}
                    type="password"
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                />
                <button onClick={this.handleSubmit}
                    name="register" disabled={isDisabled}>
                    Register
                </button>
                <button onClick={this.handleSubmit} name="login" disabled={isDisabled}>
                    Login
                </button>
            </div>
        );
    }
}
export class TinyEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: null,
            docName: '',
            tmpDocName: '',
            editorRef: null,
            isOpen: false,
            dropdownOpen: false,
            setDropdownOpen: false,
            dropdownItems: [],
            isDocumentNew: true,
            _id: null,
            token: null,
            email: null,
            password: null
        };
        this.docs = {};
        this.docNames = [];

        this.fillDropdownItems();

        this.saveDocName = this.saveDocName.bind(this);
        this.loadDocument = this.loadDocument.bind(this);
        this.updateDocument = this.updateDocument.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.log = this.log.bind(this);
        this.toggle = this.toggle.bind(this);
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.fillDropdownItems = this.fillDropdownItems.bind(this);
        this.updateToken = this.updateToken.bind(this);
    }

    async updateToken(token) {
        await Promise.resolve(this.setState({ token: token}));
        await this.fillDropdownItems();
        // console.log(`updateToken: ${token}`);
    }

    async saveDocName(e) {
        this.setState({tmpDocName: await e.target.value});
        if (this.docNames.includes(e.target.value)) {
            this.setState({isDocumentNew: false});
        } else {
            this.setState({isDocumentNew: true});
        }
        // console.log(this.state.tmpDocName);
    }

    async loadDocument(e) {
        // console.log(e.target.value);
        this.setState({value: this.docs[await e.target.value].content});
        this.setState({docName: await e.target.textContent});
        this.setState({tmpDocName: this.state.docName});
        this.setState({isDocumentNew: false});
        this.setState({_id: this.docs[await e.target.value]._id});
        console.log(this.state._id);
        socket.emit("create", this.state._id);
    }

    async updateDocument() {
        const that = this;

        // console.log("updateDocument");
        await Promise.resolve(this.setState({docName: this.state.tmpDocName}));
        if (this.state.docName !== '') {
            /*
            let docArr = {},
                data = {};
            */
            let fetchUrl = `${dsn}/mongo/update`;
            const data = {
                doc: {
                    docName: this.state.docName,
                    content: this.state.value
                },
                api_key: config.api_key
            };

            if (this.state.isDocumentNew) {
                fetchUrl = `${dsn}/mongo/create`;
            }

            /*
            docArr["docName"] = this.state.docName;
            docArr["content"] = this.state.value;
            data["doc"] = docArr;
            data["api_key"] = config.api_key;
            */
            console.log(fetchUrl);
            await fetch(fetchUrl, {
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json',
                    'x-access-token': this.state.token
                },
                method: 'PUT'
            })
                .then(function (response) {
                    console.log("response status: " + response.status);
                    that.fillDropdownItems();
                    return response;
                })
                .catch((e) => {
                    console.log(e);
                });
        } else {
            this.setState({isOpen: true});
        }
    }

    async fillDropdownItems() {
        const that = this;

        if (!this.state.token) {
            return;
        }
        await this.getDocuments()
            .then(function(docs) {
                let localDropDownItems = [];

                that.docNames = [];
                docs.forEach(function(doc, ix) {
                    localDropDownItems.push(<DropdownItem key={doc._id} data-testid={doc.docName}
                        value={ix} onClick={that.loadDocument}>{doc.docName}</DropdownItem>);
                    that.docs[doc.docName] = doc.content;
                    that.docNames.push(doc.docName);
                });
                return localDropDownItems;
            })
            .then(function(items) {
                that.setState({dropdownItems: items});
            })
            .catch(err => {
                console.log(err);
            });
    }

    async getDocuments() {
        const that = this;

        await fetch(`${dsn}/mongo/list?api_key=${config.api_key}`, {
            headers: {
                'x-access-token': this.state.token,
            },
        })
            .then(function (response) {
                return response.json();
            })
            .then(function(result) {
                // console.log("result.data:");
                // console.log(result.data);
                that.docs = result.data;
            });
        return await Promise.resolve(that.docs);
    }

    toggle() {
        this.setState({dropdownOpen: !this.state.dropdownOpen});
    }

    toggleCollapsed() {
        this.setState({isOpen: !this.state.isOpen});
    }

    log() {
        if (this.state.editorRef) {
            console.log(this.state.editorRef.getContent());
        }
    }

    async handleKeyUp(value) {
        // this.setState({ value: await value.target.innerHTML });
        // console.log("value: ");
        // console.log(await value);
        let data = {
            _id: this.state._id,
            client_id: ID,
            doc: value.target.innerHTML
        };

        // console.log("keyUp data: ");
        // console.log(data);

        const specKeys = ['Shift', 'Alt', 'Control', 'Tab', 'Meta'];

        if (!(specKeys.includes(value.key))) {
            socket.emit("doc", data);
        }
    }

    handleEditorChange(value) {
        this.setState({ value: value });
    }

    componentDidMount() {
        socket.on("doc", (data) => {
            // console.log("callSocketOn data: ");
            // console.log(data);
            if (ID !== data.client_id) {
                console.log("cupdate state.value: ");
                this.setState({value: data.doc});
            }
        });
    }

    render() {
        let editor, navbar, message;

        if (this.state.token) {
            editor = <Editor
                apiKey="6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
                onInit={(evt, editor) => this.setState({ editorRef: editor })}
                initialValue='<p>Skriv din text här!</p>'
                value={this.state.value}
                onKeyUp={this.handleKeyUp}
                onEditorChange={this.handleEditorChange}
                init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif;' +
                        'font-size:14px }'
                }}
            />;
            navbar = <Navbar color="light" light expand="md">
                <NavbarBrand>Meny: </NavbarBrand>
                <Nav className="mr-auto" navbar>
                    <NavItem>
                        <NavLink className="App-button" data-testid="Spara"
                            onClick = { this.updateDocument }>
                        Spara
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button" data-testid="Spara som"
                            onClick = { this.toggleCollapsed }>
                            Spara som
                        </NavLink>
                    </NavItem>
                    <Collapse isOpen={this.state.isOpen} unmountOnExit={true} navbar>
                        <Form>
                            <FormGroup>
                                <Input type="text" name="docName" id="docName"
                                    placeholder="Ange dokumentnamn" data-testid="docName"
                                    value={this.state.tmpDocName} onChange={this.saveDocName}/>
                                <Button onClick={this.updateDocument}>Spara dokumentet</Button>
                            </FormGroup>
                        </Form>
                    </Collapse>
                    <UncontrolledDropdown nav inNavbar>
                        <DropdownToggle nav caret  name="Redigera fil">
                            Redigera fil
                        </DropdownToggle>
                        <DropdownMenu right>
                            <DropdownItem header>Välj en fil från listan</DropdownItem>
                            {this.state.dropdownItems}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </Nav>
            </Navbar>;
        } else {
            message = <SignUpForm updateToken={this.updateToken}/>;
        }
        return (
            <>
                {/* console.log("render") */}
                { message }
                { navbar }
                { editor }
            </>
        );
    }
}

TinyEditor.propTypes = {
    value: PropTypes.string,
};

// export default { App, TinyEditor };
export default App;
// module.exports = { App, TinyEditor };
