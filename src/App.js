// src/App.js

"use strict";

import React, { Component } from 'react';
import { 
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Button,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink
} from 'reactstrap';
import { Editor } from '@tinymce/tinymce-react';

import './App.css';

class App extends Component {
  render() {
      return (
          <div className="App">
              <h1>Text editor baserad på TinyMCE och React</h1>
              <TinyEditor />
          </div>
      );
  }
}
class TinyEditor extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        value: props.initialValue ?? '<p>Skriv din text här!</p>',
        editorRef: null,
        dropdownOpen: false,
        setDropdownOpen: false
      };

      this.elements = ['Fil1', 'Fil2', 'Fil3', 'Fil4', 'Fil5'];
      this.fillDropdownItems(this.elements);

      this.handleEditorChange = this.handleEditorChange.bind(this);
      this.log = this.log.bind(this);
      this.load = this.load.bind(this);
      this.toggle = this.toggle.bind(this);
      this.fillDropdownItems = this.fillDropdownItems.bind(this);
  }

  dropdownItems = [];
  
  fillDropdownItems(items) {
    const that = this;
    items.forEach(function(item) {
      that.dropdownItems.push(<DropdownItem>{item}</DropdownItem>);
    }); 
  }

  toggle() {
    this.setState({dropdownOpen: !this.state.dropdownOpen});
  }

  log() {
    if (this.state.editorRef) {
      console.log(this.state.editorRef.getContent());
    }
  }

  load() {
    this.setState({value: "<p>Set content!</p>"});
  }

  handleEditorChange(value, editor) {
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
                onClick = {this.log}
              >
                Spara
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className="App-button"
                onClick = {this.log}
              >
                Spara som
              </NavLink>
            </NavItem>
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Redigera fil
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem header>Välj en fil från listan</DropdownItem>
                {this.dropdownItems}
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Navbar>
        {/* <button onClick={this.load}>Load</button> */}
        <Editor
          apiKey="6w4xfqcrs9ynuqz58gcd1vqv7ljydr52zcgurkczxgp96f7d"
          onInit={(evt, editor) => this.setState({editorRef: editor})}
          initialValue={this.props.initialValue}
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
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </>
    );
  }
}

export default App;
