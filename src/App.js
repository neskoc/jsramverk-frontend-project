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
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider
} from "@apollo/client";
import { Editor } from '@tinymce/tinymce-react';
import socketIOClient from "socket.io-client";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

import './App.css';
import sendEmail from "./mailgun.js";
import SignUpForm from './signupForm.js';

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

const client = new ApolloClient({
    uri: `${dsn}/graphql`,
    cache: new InMemoryCache()
});

const socket = socketIOClient(dsn);
const ID = '_' + Math.random().toString(36).substr(2, 9);

// console.log("dsn: " + dsn);
export class App extends Component {
    render() {
        return (
            <ApolloProvider client={client}>
                <App />
            </ApolloProvider>,
            <div className="App">
                <h1>Text editor baserad på React, TinyMCE och CodeMirror</h1>
                <TinyEditor />
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
            type: "text",
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

        // this.fillDropdownItems();

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
        this.export2Pdf = this.export2Pdf.bind(this);
        this.sendInvitation = this.sendInvitation.bind(this);
        this.toggleEditorType = this.toggleEditorType.bind(this);
    }

    async updateToken(token, email) {
        await Promise.resolve(this.setState({ email: email}));
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
                    content: this.state.value,
                    type: this.state.type,
                },
                api_key: config.api_key
            };

            console.log("data (before save):");
            console.log(data);
            if (this.state.isDocumentNew) {
                fetchUrl = `${dsn}/mongo/create`;
            }

            console.log(fetchUrl);
            await fetch(fetchUrl, {
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json',
                    'x-access-token': this.state.token
                },
                method: 'PUT'
            }).then(function (response) {
                console.log("response status: " + response.status);
                that.fillDropdownItems();
                return response;
            }).catch((e) => {
                console.log(e);
            });
        } else {
            this.setState({isOpen: true});
        }
    }

    async fillDropdownItems() {
        const that = this;

        if (!this.state.token) {
            console.log("Mo token");
            return;
        } else {
            console.log("Token: ", this.state.token);
        }

        await this.getGraphQLDocuments()
            .then(function(docs) {
                // console.log("getDocs: ");
                // console.log(docs.docs);
                let localDropDownItems = [];

                that.docNames = [];
                docs.forEach(function(doc, ix) {
                    if (doc.type === that.state.type) {
                        localDropDownItems.push(<DropdownItem key={doc._id}
                            data-testid={doc.docName}
                            value={ix} onClick={that.loadDocument}>{doc.docName}</DropdownItem>);
                        that.docs[doc.docName] = doc.content;
                        that.docNames.push(doc.docName);
                    }
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

    async getGraphQLDocuments() {
        const that = this;
        const email = this.state.email;
        const query = `query Docs($email: String!) {
            docs(email: $email) {
                _id
                docName
                type
                content
            }
        }`;

        // console.log("email: ", email);
        await fetch(`${dsn}/graphql`, {
            method: 'POST',
            headers: {
                'x-access-token': this.state.token,
                'api_key': config.api_key,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { email }
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function(result) {
                console.log("result.data:");
                console.log(result.data);
                that.docs = result.data.docs;
            });
        return await Promise.resolve(that.docs);
    }

    async export2Pdf() {
        const that = this;
        const content = this.state.value;

        // console.log("email: ", email);
        await fetch(`${dsn}/htmlToPdf`, {
            method: 'POST',
            headers: {
                'x-access-token': this.state.token,
                'api_key': config.api_key,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                content: { content }
            })
        })
            .then(response => response.body)
            .then(rs => {
                const reader = rs.getReader();

                return new ReadableStream({
                    async start(controller) {
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            const { done, value } = await reader.read();

                            if (done) {
                                break;
                            }
                            controller.enqueue(value);
                        }
                        controller.close();
                        reader.releaseLock();
                    }
                });
            })
            .then(stream => new Response(stream))
            .then(response => response.blob())
            .then(blob => URL.createObjectURL(blob, { type: "application/pdf" }))
            .then(url => {
                let link = document.createElement("a");

                link.href = url;
                link.download = "ConvertedFile.pdf";
                link.style.visibility = 'hidden';

                document.body.appendChild(link);

                link.click();
                setTimeout(function () {
                    window.URL.revokeObjectURL(link);
                }, 200);
            });
        return await Promise.resolve(that.docs);
    }

    toggle() {
        this.setState({dropdownOpen: !this.state.dropdownOpen});
    }

    toggleCollapsed() {
        this.setState({isOpen: !this.state.isOpen});
    }

    async toggleEditorType() {
        this.fillDropdownItems();
        await Promise.resolve(
            this.setState({type: (this.state.type === 'text' ? 'code' : 'text') })
        ).then(() => {
            console.log(this.state.type);
            if (this.state.type === 'code') {
                this.setState({ value: '// CodeMirror editor\n' });
            } else {
                this.setState({ value: '<p>Skriv din text här!</p>' });
            }
        });
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
        let doc =  value.target.innerHTML;

        if (this.state.type === 'code') {
            doc = this.state.value;
        }
        let data = {
            _id: this.state._id,
            client_id: ID,
            doc: doc,
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

    async sendInvitation() {
        await sendEmail.sendInvitation(this.state.email)
            .catch(function (error) {
                console.log(error);
            });
    }

    componentDidMount() {
        socket.on("doc", (data) => {
            // console.log("callSocketOn data: ");
            // console.log(data);
            if (ID !== data.client_id) {
                console.log("update state.value: ");
                this.setState({value: data.doc});
            }
        });
    }

    render() {
        let editor, navbar, message;

        if (this.state.token) {
            if (this.state.type === 'text') {
                editor = <Editor
                    apiKey = "6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
                    onInit = {(evt, editor) => this.setState({ editorRef: editor })}
                    initialValue = '<p>Skriv din text här!</p>'
                    value = { this.state.value }
                    onKeyUp = { this.handleKeyUp }
                    onEditorChange = { this.handleEditorChange }
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
            } else {
                editor = <CodeMirror
                    className = "editor"
                    value = { this.state.value }
                    height = "500px"
                    extensions={[javascript({ jsx: true })]}
                    onKeyUp = { this.handleKeyUp }
                    // eslint-disable-next-line no-unused-vars
                    onChange={(value, viewUpdate) => {
                        console.log('value:', value);
                        this.handleEditorChange(value);
                    }}
                />;
            }
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
                    <NavItem>
                        <NavLink className="App-button" data-testid="Export2Pdf"
                            onClick = { this.export2Pdf }>
                        Export2Pdf
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button" data-testid="sendInvitation"
                            onClick = { this.sendInvitation }>
                        Send invitation
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button" data-testid="EditorType"
                            onClick = { this.toggleEditorType }>
                            { this.state.type }
                        </NavLink>
                    </NavItem>
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
