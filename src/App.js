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

const config = require("./config/db/config.json");

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
            _id: null
        };
        this.docs = {};

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
    }

    async saveDocName(e) {
        this.setState({tmpDocName: await e.target.value});
        // console.log(this.state.tmpDocName);
    }

    async loadDocument(e) {
        // console.log(e.target.value);
        this.setState({value: this.docs[await e.target.value].content});
        this.setState({docName: await e.target.textContent});
        this.setState({tmpDocName: this.state.docName});
        this.setState({_id: this.docs[await e.target.value]._id});
        console.log(this.state._id);
        socket.emit("create", this.state._id);
    }

    async updateDocument() {
        const that = this;

        // console.log("updateDocument");
        this.setState({docName: this.state.tmpDocName});
        if (this.state.docName !== '') {
            let docArr = {},
                data = {};

            docArr["docName"] = this.state.docName;
            docArr["content"] = this.state.value;
            data["doc"] = docArr;
            data["api_key"] = config.api_key;
            await fetch(`${dsn}/mongo/update`, {
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json'
                },
                method: 'POST'
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

        await this.getDocuments()
            .then(function(docs) {
                let localDropDownItems = [];

                docs.forEach(function(doc, ix) {
                    localDropDownItems.push(<DropdownItem key={doc._id} data-testid={doc.docName}
                        value={ix} onClick={that.loadDocument}>{doc.docName}</DropdownItem>);
                    that.docs[doc.docName] = doc.content;
                });
                return localDropDownItems;
            })
            .then(function(items) {
                that.setState({dropdownItems: items});
            });
    }

    async getDocuments() {
        const that = this;

        await fetch(`${dsn}/mongo/list?api_key=${config.api_key}`)
            .then(function (response) {
                return response.json();
            }).then(function(result) {
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
        return (
            <>
                {/* console.log("render") */}
                <Navbar color="light" light expand="md">
                    <NavbarBrand>Meny: </NavbarBrand>
                    <Nav className="mr-auto" navbar>
                        <NavItem>
                            <NavLink className="App-button" data-testid="Spara"
                                onClick = {this.updateDocument}>
                            Spara
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className="App-button" data-testid="Spara som"
                                onClick = {this.toggleCollapsed}>
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
                </Navbar>
                <Editor
                    apiKey="6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
                    onInit={(evt, editor) => this.setState({editorRef: editor})}
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
                />
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
