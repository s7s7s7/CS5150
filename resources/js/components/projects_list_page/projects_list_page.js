import React from 'react'
import { Link } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import Modal from 'react-responsive-modal';
import Select from 'react-select';
import { LoginContext } from '../App';

class Projects_list_page extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            columnDefs: [
                {
                    headerName: 'ID',
                    field: 'projectID',
                    width:100,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true,
                    pinned: "left",
                    hide: true
                }, {
                    headerName: 'Project',
                    field: 'projectName',
                    width: 350,
                    resizable: true,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true,
                    pinned: "left"
                }, {
                    headerName: 'Details',
                    field: 'details',
                    width: 100,
                    filter: "agTextColumnFilter",
                    suppressMovable: true,
                    pinned: 'left',
                    cellRenderer: function (params) {
                        return "<a href='/individual_project/" + params.value + "'>Details</a>"
                    }
                }, {
                    headerName: 'Start Date',
                    field: 'startDate',
                    width: 100,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true
                }, {
                    headerName: 'Due Date',
                    field: 'dueDate',
                    width: 100,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true
                }, {
                    headerName: 'Status',
                    field: 'status',
                    width: 100,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true
                }, {
                    headerName: 'Technology',
                    field: 'tech',
                    width: 300,
                    resizable: true,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true
                }, {
                    headerName: 'Initial Estimated Hours',
                    field: 'estMaxHours',
                    width: 200,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true
                }, {
                    headerName: 'Total Assigned Hours',
                    field: 'hoursTotal',
                    width: 200,
                    sortable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true,
                    cellStyle: function (params) {
                        if (params.value > params.data.estMaxHours) { 
                            return { color: 'red' }; //mark cell as red
                        } else if (params.value <= params.data.estMaxHours) {
                            return { color: null }; //unmark cell
                        } else {
                            return null;
                        }
                    }
                }
            ],
            rowData: [],

            // Modal for adding new project modal
            showPopupAdd: false,
            showPopupDelete: false,
            newProjectName: "",
            newTechnology: "",
            newEstMaxHours: "",
            newStatus: "Ongoing",
            newStartDate: "",
            newDueDate: "",

            // modal for deleting project modal
            selectedOption: "",
        };

        //adding new project modal
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSetProjName = this.handleSetProjName.bind(this);
        this.handleSetTech = this.handleSetTech.bind(this);
        this.handleSetHours = this.handleSetHours.bind(this);
        this.handleSetStartDate = this.handleSetStartDate.bind(this);
        this.handleSetDueDate = this.handleSetDueDate.bind(this);

        //deleting project modal
        this.projOptions = [];
        this.handleDelete = this.handleDelete.bind(this);
    }

    /** Processes the raw data to make them ready for display on table */
    async processData(data) {
        var rowData = [];
        var rowJSON = {};
        for (let i = 0; i < data.length; i++) {
            let currJSON = data[i];
            let currProjectID = currJSON.ProjectID;
            let currProjectName = currJSON.ProjectName;
            let currStatus = currJSON.Status;
            let currTech = currJSON.Technology;
            let currStartDate = currJSON.StartDate;
            let currDueDate = currJSON.DueDate;
            let currEstMaxHours = currJSON.EstMaxHours;
            let currHoursTotal = currJSON.TotalHoursAssigned;

            rowJSON = {
                projectID: currProjectID,
                projectName: currProjectName,
                details: currProjectID,
                startDate: currStartDate,
                dueDate: currDueDate,
                status: currStatus,
                tech: currTech,
                estMaxHours: currEstMaxHours,
                hoursTotal: currHoursTotal
            };

            rowData.push(rowJSON);
        }

        return rowData
    }


    /* Methods for the adding project modal */
    togglePopupAdd() {
        this.setState({
            showPopupAdd: !(this.state.showPopupAdd)
        });
    }

    handleSetProjName(event) {
        this.setState({
            newProjectName: event.target.value
        });
    }

    handleSetTech(event) {
        this.setState({
            newTechnology: event.target.value
        });
    }

    handleSetHours(event) {
        this.setState({
            newEstMaxHours: event.target.value
        });
    }

    handleSetStartDate(event) {
        this.setState({
            newStartDate: event.target.value
        });
    }

    handleSetDueDate(event) {
        this.setState({
            newDueDate: event.target.value
        });
    }


    /** Handles the add event button */
    async handleSubmit(event) {
        let newProjData = {
            "ProjectName": this.state.newProjectName,
            "Technology": this.state.newTechnology,
            "EstMaxHours": this.state.newEstMaxHours,
            "Status": this.state.newStatus,
            "StartDate": this.state.newStartDate,
            "DueDate": this.state.newDueDate
        }
        let response = await fetch(`../api/addProject`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProjData),
        });
    }


    /* Methods for the deleting project modal */
    togglePopupDelete() {
        this.setState({
            showPopupDelete: !(this.state.showPopupDelete)
        });
    }

    handleSelect(selection) {
        console.log(this);
        this.setState({ selectedOption: selection });
    }


    /** Handles the delete event button */
    async handleDelete(event) {
        console.log("Deleting Form");
        let ProjData = {
            "ProjectName": this.state.selectedOption["label"]
        };
        let response = await fetch(`../api/deleteProject`, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ProjData),
        });        
    }

    async componentDidMount() {
        fetch(`../api/displayAllProjectInfo`)
            .then(result => result.json())
            .then(data => this.processData(data))
            .then(function (newData) {
                this.setState({ rowData: newData });
            }.bind(this));

        let names = await fetch(`../api/displayAllProjects`)
            .then(result => result.json())
            .then(function (data) {
                return data.map(a => a.ProjectName);
            });

        console.log(names);
        for (let i = 0; i < names.length; i++) {
            this.projOptions.push({ label: (names[i]), value: 1 });
        }
        console.log(this.projOptions);
    }

    /** Generates a button. Buttons are made only visible for logged in users*/
    buttonGenerator() {
        let value = window.sessionStorage.getItem("value");
        if (value === "logged") {
            return (
                <div>
                    <button
                        style={{ height: '30px', width: '100px', marginRight: '10px' }}
                        onClick={this.togglePopupAdd.bind(this)}
                    >Add Project</button>

                    <button
                        style={{ height: '30px', width: '100px', marginRight: '10px' }}
                        onClick={this.togglePopupDelete.bind(this)}
                    >Delete Project</button>
                </div>
            )
        }
    }

    render() {
        return (
            <div
                className="ag-theme-balham"
                style={{
                    height: '65vh',
                    width: '100vw'
                }}
            >

                <AgGridReact
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.rowData}
                >
                </AgGridReact>

                <Modal open={this.state.showPopupAdd} onClose={this.togglePopupAdd.bind(this)} center closeIconSize={14}>
                    <h4 style={{ marginTop: '15px' }}>Adding a New Project</h4>
                    <form onSubmit={this.handleSubmit}>
                        <label style={{ marginRight: '15px' }}>Project Name:</label>
                        <input style={{ float: 'right' }} type="text" required value={this.state.newProjectName} onChange={this.handleSetProjName} />
                        <br></br>
                        <label style={{ marginRight: '15px' }}>Technology:</label>
                        <input style={{ float: 'right' }} type="text" required value={this.state.newTechnology} onChange={this.handleSetTech} />
                        <br></br>
                        <label style={{ marginRight: '15px' }}>Estimated Maximum Hours for This Project:</label>
                        <input style={{ float: 'right' }} type="number" min="0" required value={this.state.newEstMaxHours} onChange={this.handleSetHours} />
                        <br></br>
                        <label style={{ marginRight: '15px' }}>Start Date:</label>
                        <input style={{ float: 'right' }} type="date" required value={this.state.newStartDate} onChange={this.handleSetStartDate} />
                        <br></br>
                        <label style={{ marginRight: '15px' }}>Due Date:</label>
                        <input style={{ float: 'right' }} type="date" required value={this.state.newDueDate} onChange={this.handleSetDueDate} />
                        <br></br>
                        <input type="submit" value="Submit" />
                    </form>
                </Modal>

                <Modal open={this.state.showPopupDelete} onClose={this.togglePopupDelete.bind(this)} center closeIconSize={14}>
                    <h4 style={{ marginTop: '15px', width: '300px' }}>Deleting a Project</h4>
                    <form onSubmit={this.handleDelete}>
                        <br></br>
                        <label style={{ marginRight: '15px' }}>
                            Project Name:
                        </label>
                        <br></br>
                        <Select value={this.state.selectedOption} onChange={this.handleSelect.bind(this)} options={this.projOptions}>
                        </Select>

                        <br></br>
                        <br></br>
                        <input type="submit" value="Submit" />
                    </form>
                </Modal>
                {this.buttonGenerator()}
            </div>
        );
    }
}

export default Projects_list_page