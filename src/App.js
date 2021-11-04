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
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

import './App.css';
import sendEmail from "./mailgun.js";
import execjs from './exec.js';
import SignUpForm from './signupForm.js';
import Comment from './comment.js';
import HiddenDiv from './hiddenDiv.js';
// import Popup from './popup.js';
// const execjsExternal = require("./exec.js");

let config = require("./config/db/config.json");

config.api_key = process.env.API_KEY || config.api_key;
config.azure_base_url = process.env.AZURE_BASE_URL || config.azure_base_url;

let dsn = config.azure_base_url;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

    if (process.env.REACT_APP_LOCAL === 'true') {
        dsn = "http://localhost:1337";
        // console.log('local db');
    }
}

// const socket = socketIOClient(dsn);
// const ID = '_' + Math.random().toString(36).substr(2, 9);

// console.log("dsn: " + dsn);
export class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value,
        };
    }

    render() {
        return (
            <div className="App">
                <h1>Text editor baserad på React, TinyMCE och CodeMirror</h1>
                <TinyEditor value={this.state.value}/>
            </div>
        );
    }
}


App.propTypes = {
    value: PropTypes.string,
};
export class TinyEditor extends React.Component {
    constructor(props) {
        super(props);
        if (process.env.NODE_ENV === 'test') {
            this.email = 'baraengang-mailgun@yahoo.com';
            this.password = 'MailgunPa55';
        }
        this.state = {
            _id: null,
            commentItems: [],
            comments: [],
            currentCommentMaxId: 0,
            docName: '',
            dropdownItems: [],
            dropdownOpen: false,
            editorRef: null,
            email: this.email || null,
            execjsResult: '',
            hiddenDivStatus: true,
            isDocumentNew: true,
            isOpen: false,
            maxId: 0,
            mailgunResponse: null,
            password: this.password || null,
            setDropdownOpen: false,
            tmpDocName: '',
            token: null,
            type: "text",
            value: this.props.value,
        };
        this.docs = {};
        this.docNames = [];
        this.rowElements = [ 'P', 'LI', 'H3', 'H2', 'H1' ];
        if (process.env.NODE_ENV !== 'test') {
            this.socket = socketIOClient(dsn);
        }
        this.ID = '_' + Math.random().toString(36).substr(2, 9);

        // this.fillDropdownItems();

        this.execjsLocal = this.execjsLocal.bind(this);
        this.export2Pdf = this.export2Pdf.bind(this);
        this.fillDropdownItems = this.fillDropdownItems.bind(this);
        this.handleCommentDelete = this.handleCommentDelete.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.loadDocument = this.loadDocument.bind(this);
        this.log = this.log.bind(this);
        this.prepareComments = this.prepareComments.bind(this);
        this.saveDocName = this.saveDocName.bind(this);
        this.sendInvitation = this.sendInvitation.bind(this);
        this.toggle = this.toggle.bind(this);
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.updateDocument = this.updateDocument.bind(this);
        this.toggleEditorType = this.toggleEditorType.bind(this);
        this.updateToken = this.updateToken.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        if (process.env.NODE_ENV !== 'test') {
            this.socket.on("doc", (data) => {
                // console.log("callSocketOn data: ");
                // console.log(data);
                if (this.ID !== data.client_id) {
                    console.log("update state.value: ");
                    this.setState({value: data.doc});
                }
            });
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async execjsLocal(value) {
        await execjs(value)
            .then(res => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(res);
                }

                this.setState({ execjsResult: res });
            })
            .catch(err => console.error(err));
    }

    async updateToken(token, email) {
        if (this._isMounted) {
            await Promise.resolve(this.setState({ email: email}));
            await Promise.resolve(this.setState({ token: token}));
            await this.fillDropdownItems();
        }
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

    async handleCommentDelete(event) {
        const id = parseInt(event.currentTarget.id.slice(7));

        let doc,
            localComments = this.state.comments;

        for (var i = 0; i < this.docs.length; i++) {
            if (this.docs[i].docName === this.state.docName) {
                doc = this.docs[i];
                // document.getElementById(id);
                break;
            }
        }

        // let comments = doc.comments.filter(comment => comment.id !== id);

        // this.docs[i].comments = comments;
        if (doc) {
            this.docs[i].comments = doc.comments.filter(comment => comment.id !== id);
            localComments = this.docs[i].comments;
        } else {
            localComments = localComments.filter(comment => comment.id !== id);
        }
        // console.log("comments:");
        // console.log(comments);
        if (localComments.length > 0) {
            this.prepareComments(localComments);
        } else {
            this.setState({ commentItems: [] });
            this.setState({ comments: [] });
        }
        let markId = `mark-${id}`,
            htmlDoc = new DOMParser().parseFromString(this.state.value, 'text/html'),
            innerHTML = htmlDoc.getElementById(markId).innerHTML;

        htmlDoc.getElementById(markId).parentNode.innerHTML = innerHTML;
        // console.log('htmlDoc.outerHTML');
        // console.log(htmlDoc.body.innerHTML);
        this.setState({ value: htmlDoc.body.innerHTML });
    }

    prepareComments(comments) {
        const localCommentItems = [];

        comments.forEach( (comment) => {
            localCommentItems.push(
                <Comment key={comment.id}
                    id={comment.id}
                    comment={comment.comment}
                    handleCommentDelete={this.handleCommentDelete}
                />
            );
            if (comment.id > this.state.currentCommentMaxId) {
                this.setState({ currentCommentMaxId: parseInt(comment.id) });
            }
        });
        // console.log(localCommentItems);
        this.setState({ comments: comments });
        this.setState({ commentItems: localCommentItems });
    }

    addComment(comment) {
        let docFound = false;

        let commentObj = {
            id: this.state.currentCommentMaxId,
            comment: comment,
        };

        for (var i = 0; i < this.docs.length; i++) {
            if (this.docs[i].docName === this.state.docName) {
                docFound = true;
                break;
            }
        }

        if (docFound) {
            if (!this.docs[i].comments) {
                this.docs[i].comments = [];
            }
            this.docs[i].comments.push(commentObj);
            this.prepareComments(this.docs[i].comments);
        } else {
            let localComments = this.state.comments;

            localComments.push(commentObj);
            this.prepareComments(localComments);
        }
        // console.log(`comment: ${comment}`);
    }

    async loadDocument(e) {
        const doc = this.docs[await e.target.value];

        this.setState({value: doc.content});
        this.setState({docName: await e.target.textContent});
        this.setState({tmpDocName: this.state.docName});
        this.setState({isDocumentNew: false});
        this.setState({_id: doc._id});
        if (doc.comments) {
            const comments = [];

            doc.comments.forEach(function(comment) {
                let commentObj = {};

                commentObj.id = comment.id;
                commentObj.comment = comment.comment;
                comments.push(commentObj);
            });
            this.prepareComments(comments);
        } else {
            this.setState({ comments: [] });
            this.setState({ commentItems: [] });
            this.setState({ currentCommentMaxId: 0 });
        }
        if (process.env.NODE_ENV !== 'test') {
            this.socket.emit("create", this.state._id);
        }
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
                    _id: this.state._id,
                    docName: this.state.docName,
                    content: this.state.value,
                    type: this.state.type,
                    comments: this.state.comments,
                },
                api_key: config.api_key
            };

            // console.log("data (before save):");
            // console.log(data);
            if (this.state.isDocumentNew) {
                fetchUrl = `${dsn}/mongo/create`;
            }

            // console.log(fetchUrl);
            await fetch(fetchUrl, {
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json',
                    'x-access-token': this.state.token
                },
                method: 'PUT'
            }).then(function (response) {
                // console.log("response status: " + response.status);
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
            // console.log("Mo token");
            return;
        }/*  else {
            console.log("Token: ", this.state.token);
        } */

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
                if (that._isMounted) {
                    that.setState({dropdownItems: items});
                }
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
                comments {
                    id
                    comment
                }
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
                // console.log("result.data:");
                // console.log(result.data);
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
            .then((response) => {
                return response.body;
            })
            .then(rs => {
                // console.log(that);

                if (process.env.NODE_ENV === 'test') {
                    let link = document.createElement("a");

                    link.href = '.';
                    link.text = "ConvertedFile";
                    link.textContent = "ConvertedFile";
                    link.style.visibility = 'hidden';

                    document.body.appendChild(link);
                    // console.log(link);

                    setTimeout(function () {
                        window.URL.revokeObjectURL(link);
                    }, 15000);
                    throw new Error('test');
                } else {
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
                }
            })
            .then(stream => new Response(stream))
            .then(response => response.blob())
            .then(blob => URL.createObjectURL(blob, { type: "application/pdf" }))
            .then(url => {
                let link = document.createElement("a");

                link.href = url;
                link['data-testid'] = "ConvertedFile";
                link.download = "ConvertedFile.pdf";
                link.style.visibility = 'hidden';

                document.body.appendChild(link);

                link.click();
                setTimeout(function () {
                    window.URL.revokeObjectURL(link);
                }, 2000);
            })
            .catch(() => {
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
            // console.log(this.state.type);
            if (this.state.type === 'code') {
                this.setState({ value: 'console.log("Test ExecJS");' });
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
            client_id: this.ID,
            doc: doc,
        };

        // console.log("keyUp data: ");
        // console.log(data);

        const specKeys = ['Shift', 'Alt', 'Control', 'Tab', 'Meta'];

        if (!(specKeys.includes(value.key))) {
            if (process.env.NODE_ENV !== 'test') {
                this.socket.emit("doc", data);
            }
        }
    }

    handleEditorChange(value) {
        this.setState({ value: value });
    }

    async sendInvitation() {
        await sendEmail.sendInvitation(this.state.email)
            .then(res => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(res);
                }

                this.setState({ mailgunResponse: res });
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    findClosestRowElement(editor) {
        // console.log('editor');
        // console.log(editor);

        let result = {};

        let row = editor.selection.getNode().closest(this.rowElements[0]),
            nodeType = this.rowElements[0],
            innerLen = Number.MAX_VALUE;

        if (row) {
            innerLen = row.innerHTML.length;
        }
        // console.log('this.rowElements[0]');
        // console.log(this.rowElements[0]);
        this.rowElements.slice(1).forEach(function (element) {
            let hlpRow = editor.selection.getNode().closest(element);

            if (hlpRow && hlpRow.innerHTML.length < innerLen) {
                row = hlpRow;
                nodeType = element;
            }
        });
        if (row) {
            innerLen = row.innerHTML.length;
            let nodeTypeLen = nodeType.length,
                outerContent = row.outerHTML,
                outerLen = outerContent.length,
                postfixLen = nodeTypeLen + 3,
                prefixLen = outerLen - innerLen - postfixLen,
                nodePrefix = outerContent.slice(0, prefixLen),
                nodePostfix = outerContent.slice(-postfixLen);

            result = {
                row: row,
                innerContent: row.innerHTML,
                nodePrefix: nodePrefix,
                nodePostfix: nodePostfix,
            };
            // console.log(`nodePrefix: ${nodePrefix}`);
            // console.log(`nodePostfix: ${nodePostfix}`);
            // console.log(`nodeType: ${nodeType}`);
        }

        return result;
    }

    render() {
        let editor,
            navbar,
            comments,
            message,
            execButton,
            hiddenDiv1,
            hiddenDiv2;

        if (this.state.token) {
            message = null;
            hiddenDiv2 = <HiddenDiv
                testId='mailgun'
                text={this.state.mailgunResponse}
                hidden={true}
            />;
            if (this.state.type === 'text') {
                editor = <Editor
                    apiKey = "6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
                    onInit = {(evt, editor) => {
                        this.setState({ editorRef: editor });
                    }}
                    initialValue = '<p>Skriv din text här!</p>'
                    value = { this.state.value }
                    onKeyUp = { this.handleKeyUp }
                    onEditorChange = { this.handleEditorChange }
                    init={{
                        height: 500,
                        menubar: false,
                        plugins: [
                            'advlist autolink code lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code help wordcount'
                        ],
                        block_formats: 'Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif;' +
                            'font-size:14px }',
                        toolbar: 'undo redo | formatselect | ' +
                            'bold italic | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            ' kommentera',
                        that: this,
                        setup: function (editor) {
                            let that = this.that;

                            function commentOnAction() {
                                editor.focus();
                                if (!editor.selection.getNode().closest('MARK')) {
                                    let res = that.findClosestRowElement(editor);

                                    if (res) {
                                        that.setState({
                                            currentCommentMaxId: that.state.currentCommentMaxId + 1
                                        });
                                        let commentId = that.state.currentCommentMaxId,
                                            comment = prompt('Kommentar för raden');

                                        if (comment) {
                                            const id = `mark-${commentId}`;

                                            editor.selection.select(res.row);
                                            editor.selection.setContent(
                                                `${res.nodePrefix}<mark id='${id}'>` +
                                                res.innerContent +
                                                `</mark>${res.nodePostfix}`
                                            );
                                            // console.log(`id: ${id}`);
                                            that.addComment(comment);
                                        }
                                    }
                                } else {
                                    alert('Den här raden redan har en kommentar!');
                                }
                            }

                            editor.ui.registry.addButton('kommentera', {
                                text: 'Kommentera',
                                icon: 'bookmark',
                                tooltip: 'Kommentera markerad text',
                                onAction: commentOnAction,
                            });
                        },
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
                    onChange={(value) => {
                        // console.log('value:', value);
                        this.handleEditorChange(value);
                    }}
                />;
            }

            if (this.state.type === 'code') {
                execButton =
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid="execjs"
                            onClick = { () => this.execjsLocal(this.state.value) }>
                            ExecJS
                        </NavLink>
                    </NavItem>;
                hiddenDiv1 = <HiddenDiv
                    testId='execjsResult'
                    text={this.state.execjsResult}
                    hidden={this.state.hiddenDivStatus}
                />;
            }
            navbar = <Navbar color="light" light expand="md">
                <NavbarBrand>Meny: </NavbarBrand>
                <Nav className="mr-auto" navbar>
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid="Spara"
                            onClick = { this.updateDocument }>
                        Spara
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid="Spara som"
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
                        <DropdownToggle nav caret  name="Redigera fil"
                            data-testid="Redigera fil">
                            Redigera fil
                        </DropdownToggle>
                        <DropdownMenu right>
                            <DropdownItem header>Välj en fil från listan</DropdownItem>
                            {this.state.dropdownItems}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid="Export2Pdf"
                            onClick = { this.export2Pdf }>
                        Export2Pdf
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid="sendInvitation"
                            onClick = { this.sendInvitation }>
                        Skicka inbjudan
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className="App-button"
                            data-testid='EditorType'
                            onClick = { this.toggleEditorType }>
                            { this.state.type }
                        </NavLink>
                    </NavItem>
                    { execButton }
                </Nav>
            </Navbar>;
            comments = this.state.commentItems;
        } else {
            message = <SignUpForm updateToken={this.updateToken}
                email={this.state.email}
                password={this.state.password}
            />;
        }
        return (
            <>
                {/* console.log("render") */}
                { message }
                { navbar }
                { editor }
                { comments }
                { hiddenDiv1 }
                { hiddenDiv2 }
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
