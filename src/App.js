// src/App.js

"use strict";

import React, { Component } from 'react';
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

import './App.css';

const config = require("./config/db/config.json");

let dsn = config.azure_base_url;

if (process.env.NODE_ENV === 'local') {
    dsn = "http://localhost:1337";
}
console.log("dsn: " + dsn);
class App extends Component {
    render() {
        return (
            <div className="App">
                <h1>Text editor baserad på React and TinyMCE</h1>
                <TinyEditor />
            </div>
        );
    }
}

class TinyEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '<p>Skriv din text här!</p>',
            docName: '',
            tmpDocName: '',
            editorRef: null,
            isOpen: false,
            dropdownOpen: false,
            setDropdownOpen: false,
            dropdownItems: []
        };
        this.docs = {};

        this.fillDropdownItems();

        this.saveDocName = this.saveDocName.bind(this);
        this.loadDocument = this.loadDocument.bind(this);
        this.updateDocument = this.updateDocument.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.log = this.log.bind(this);
        this.load = this.load.bind(this);
        this.toggle = this.toggle.bind(this);
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.fillDropdownItems = this.fillDropdownItems.bind(this);
    }

    async saveDocName(e) {
        console.log(e.target.value);
        this.setState({tmpDocName: await e.target.value});
        console.log(this.state.tmpDocName);
    }

    async loadDocument(e) {
        console.log(e.target.textContent);
        this.setState({value: this.docs[e.target.textContent]});
        this.setState({docName: await e.target.textContent});
        this.setState({tmpDocName: this.state.docName});
    }

    async updateDocument() {
        const that = this;

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

                docs.forEach(function(doc) {
                    localDropDownItems.push(<DropdownItem key={doc._id}
                        onClick={that.loadDocument}>{doc.docName}</DropdownItem>);
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
                console.log("result.data:");
                console.log(result.data);
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

    load() {
        this.setState({value: "<p>Set content!</p>"});
    }

    handleEditorChange(value) {
        this.setState({ value: value });
    }

    render() {
        return (
            <>
                <Navbar color="light" light expand="md">
                    <NavbarBrand>Meny: </NavbarBrand>
                    <Nav className="mr-auto" navbar>
                        <NavItem>
                            <NavLink className="App-button"
                                onClick = {this.updateDocument}>
                            Spara
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className="App-button"
                                onClick = {this.toggleCollapsed}>
                            Spara som
                            </NavLink>
                        </NavItem>
                        <Collapse isOpen={this.state.isOpen} unmountOnExit={true} navbar>
                            <Form>
                                <FormGroup>
                                    <Input type="text" name="docName" id="docName"
                                        placeholder="Ange dokumentnamn"
                                        value={this.state.tmpDocName} onChange={this.saveDocName}/>
                                    <Button onClick={this.updateDocument}>Spara dokumentet</Button>
                                </FormGroup>
                            </Form>
                        </Collapse>
                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>
                                Redigera fil
                            </DropdownToggle>
                            <DropdownMenu right>
                                <DropdownItem header>Välj en fil från listan</DropdownItem>
                                {this.state.dropdownItems}
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </Nav>
                </Navbar>
                {/* <button onClick={this.load}>Load</button> */}
                <Editor
                    apiKey="6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
                    onInit={(evt, editor) => this.setState({editorRef: editor})}
                    initialValue={this.state.value}
                    value={this.state.value}
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

export default App;
