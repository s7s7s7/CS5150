import React from 'react'
import { Link } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import 'ag-grid-community/dist/styles/ag-theme-blue.css';
import 'ag-grid-community/dist/styles/ag-theme-fresh.css';
import Modal from 'react-responsive-modal';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import Select from 'react-select';
import ReactNotification from "react-notifications-component";
import TextareaAutosize from "react-autosize-textarea";
import './style.css';

let moment = require('moment');
class Individual_project_page extends React.Component {

    /*** Constructor that is called when component is initialized. Entry point of this component
     *
     * @param props
     */
    constructor(props) {
        super(props);
        this.addDueDateNotification = this.addDueDateNotification.bind(this); // function to add a due date notification
        this.notificationDOMRef = React.createRef(); // ref for the notification bar
        this.updatedRows = new Set(); // set of all row indicies that have been updated
        this.nameToNetID = new Map(); // mapping between name to net id
        this.projectName = ""; // current project name
        this.statusOptions = [ // project status options
            { label: "Ongoing", value: 1 },
            { label: "Inactive", value: 1 },
            { label: "Done", value: 1 },
            { label: "On Hold", value: 1 },
        ];
        this.dueDate = undefined; // dueDate of the project
        this.currentDate = moment(); // the current date
        this.latestDate = undefined;  // the latest date in the table
        this.resourceDateOptions = []; // options for the resource work date
        this.resourceNameOptions = []; // options for the resource names
        this.resourceNetIDOptions = []; // options for net id options
        this.resourcesWithComments = new Set(); // lists the schedules that have comments associated with them
        this.state = { // state is initialized to just have two column definitions, and no row data.
            // the column definitions and row data are actually updated in compoundDidMount()
            selectedOption: "", // selectedOption for status
            openTypeWarning: false, // flag for showing type warning for input to cell
            openNoScheduleWarning: false, //
            columnDefs: [{
                headerName: "Name", field: "name", filter: "agTextColumnFilter", cellClass: "suppress-movable-col"// headerName is the name of the column, field is what is
                // referenced by row data. For instance, to create a row for these two column defs, you would do
                // [{"name" : Jonathan Ou}, {"role": "Product Manager"}]
            }, {
                headerName: "Role", field: "role", filter: "agTextColumnFilter", cellClass: "suppress-movable-col"
            }],
            rowData: [], // the data in the row
            openProjectFormModal: false, // flag for opening the project form modal
            updatedProjectName: "", // new project name from the form
            updatedProjectTechnology: "", // new project technology from the form
            updatedProjectDueDate: "", // new project due date from the form
            updatedProjectStartDate: "", // new project start date from the form
            updatedProjectMaxHours: "", // new project max hours from the form
            openCommentView: false, // open the form for adding/editing a comment
            updatedCommentUser: "", // new updated user from the comment form
            updatedCommentNetID: "", // new updated net id from the comment form
            updatedCommentWeek: "", // new updated week from the comment form
            updatedCommentData: "" // new updated data from the comment form
        }
    }

    /***
     * Processes data from /api/displayResourceInfoPerProject
     *
     * @param data
     * @returns {{rowData: Array, columnDefs: []}}, where rowData is the data to be placed in the grid, and column
     * defs is the names of each of the individual columns
     */
    async processData(data) {
        let projectID = this.props.match.params.projectID; // project id of this project
        let comments = await fetch(`../api/getComments/${projectID}`);
        let commentsJSON = await comments.json();
        this.resourcesWithComments = new Set(); // add comments to the set

        for (let i = 0; i < commentsJSON.length; i++) {
            this.resourcesWithComments.add(commentsJSON[i].NetID + ":" + commentsJSON[i].Dates);
        }
        let columnDefs = [
            { headerName: 'Name', field: 'name', sortable: true, filter: "agTextColumnFilter", suppressMovable: true, pinned: 'left' },
            { headerName: 'NetID', field: 'netid', sortable: true, filter: "agTextColumnFilter", suppressMovable: true, pinned: 'left', hide: true },
            { headerName: 'Role', field: 'role', sortable: true, enableCellChangeFlash: true, filter: "agTextColumnFilter", suppressMovable: true, pinned: 'left' },
        ];
        if (data.length == 0) {
            columnDefs = [];
        }
        let rowData = [];
        let columnNames = new Set();
        let prevNetID = null;
        let currentJSON = {};
        let currentWeekRecorded = false;
        for (let i = 0; i < data.length; i++) {
            let currentSchedule = data[i];
            let currentNetID = currentSchedule.NetID;
            let currentHeader = currentSchedule.Dates;
            if (!moment(currentHeader).isSameOrAfter(this.currentDate, 'week')) {
                continue;
            }
            if (!currentWeekRecorded) {
                currentWeekRecorded = true;
            }

            let fullName = currentSchedule.FirstName + " " + currentSchedule.LastName;

            if (currentNetID != prevNetID) {
                if (prevNetID != null) {
                    rowData.push(currentJSON);
                }

                let currentRole = currentSchedule.Role;
                prevNetID = currentNetID;
                currentJSON = { netid: currentNetID, name: fullName, role: currentRole };
            }

            let currentHours = currentSchedule.HoursPerWeek;

            if (!columnNames.has(currentHeader)) {
                columnNames.add(currentHeader);
                let newColumnDef = {
                    headerName: currentHeader,
                    field: currentHeader,
                    sortable: true,
                    enableCellChangeFlash: true,
                    editable: true,
                    filter: "agTextColumnFilter",
                    suppressMovable: true,
                    cellStyle: function (params) {
                        let key = params.data.netid + ":" + params.colDef.field;
                        if (this.resourcesWithComments.has(key)) {
                            //mark police cells as red
                            return { backgroundColor: 'yellow' };
                        } else {
                            return null;
                        }
                    }.bind(this)
                };
                columnDefs.push(newColumnDef);
            }

            currentJSON[currentHeader] = currentHours;
        }

        rowData.push(currentJSON);
        let dates = columnDefs.slice(3);
        this.resourceDateOptions = [];
        let seenDates = new Set();
        for (let i = 0; i < dates.length; i++) {
            let name = dates[i]["headerName"];
            if (!seenDates.has(name)) {
                this.resourceDateOptions.push({ label: name, value: 1 });
                seenDates.add(name);
            }
        }

        // function that sorts row data by ascending dates
        let dateComparator = function (a, b) {
            if (a.field < b.field) {
                return -1;
            }
            if (a.field > b.field) {
                return 1;
            }
            return 0;
        };
        dates.sort(dateComparator);
        if (dates.length != 0) {
            this.latestDate = dates[dates.length - 1].field;
        }
        columnDefs = columnDefs.slice(0, 3).concat(dates);
        return { "rowData": rowData, "columnDefs": columnDefs };
    }

    /***
     * This function is always called right after the constructor for this class is called, and the component is
     * loaded onto a screen via render()
     * It makes a GET request to the api (argument to the fetch function), retrieves it, then processes the data
     * using processData to create new row data and column definitions, and then updates the state to those values.
     * That is why when you load this page, it starts off empty and then data populates the grid.
     * It is called once, immediately after render() is first called
     */
    async componentDidMount() {
        let projectID = this.props.match.params.projectID;
        await fetch(`../api/displayResourceInfoPerProject/${projectID}`)
            .then(result => result.json())
            .then(data => this.processData(data))
            .then(function (newStuff) {
                this.setState({ rowData: newStuff["rowData"], columnDefs: newStuff["columnDefs"] })
            }.bind(this));

        let response = await fetch(`../api/displayProjectInfo/${projectID}`);
        let actualResponse = await response.json();
        let currentStatus = actualResponse[0]["Status"];
        this.dueDate = actualResponse[0]["DueDate"];
        let theSelectedOption = {};
        if (currentStatus == "Ongoing") {
            theSelectedOption = { label: "Ongoing", value: 1 };
        }

        else if (currentStatus == "Inactive") {
            theSelectedOption = { label: "Inactive", value: 2 };
        }

        else if (currentStatus == "Done") {
            theSelectedOption = { label: "Done", value: 3 };
        }

        else if (currentStatus == "On Hold") {
            theSelectedOption = { label: "On Hold", value: 4 };
        }

        let projectName = actualResponse[0]["ProjectName"];
        let technology = actualResponse[0]["Technology"];
        let maxHours = actualResponse[0]["EstMaxHours"];
        let startDate = actualResponse[0]["StartDate"];
        let dueDate = actualResponse[0]["DueDate"];
        this.setState({
            updatedProjectName: projectName,
            updatedProjectTechnology: technology,
            updatedProjectMaxHours: maxHours,
            updatedProjectStartDate: startDate,
            updatedProjectDueDate: dueDate,
            selectedOption: theSelectedOption
        });
        let names = await fetch(`../api/getNames/${projectID}`);
        let names_json = await names.json();
        for (let i = 0; i < names_json.length; i++) {
            let name = names_json[i]["FirstName"] + " " + names_json[i]["LastName"];
            let netid = names_json[i]["NetID"];
            this.resourceNameOptions.push({ label: name, value: 1 });

            if (this.nameToNetID.has(name)) {
                let old_arr = this.nameToNetID.get(name);
                old_arr.push(netid);
                this.nameToNetID.set(name, old_arr);
            } else {
                this.nameToNetID.set(name, [netid]);
            }
        }
    }

    /***
     * Makes API call to update all the edited rows prior to this call in the database
     * Also, if project status is updated, saveData() makes an API call to update that as well
     * Clears the edited rows so we don't save the same information twice
     */
    async saveData() {
        let data = this.state.rowData;
        let projectID = this.props.match.params.projectID;

        let updatedRows = this.updatedRows;

        // index is the index of a row that has been updated

        let processData = async function (pair) {
            let index = pair["rowIndex"];
            let key = pair["colIndex"];
            let netID = data[index]["netid"];
            let hours = data[index][key];
            let newData = {
                "ProjectID": projectID,
                "NetID": netID,
                "Dates": key,
                "HoursPerWeek": hours
            };
            let response = await fetch('../api/updateSchedule', {
                method: "PUT",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newData)
            });
        }
        updatedRows.forEach(processData);
        this.updatedRows.clear();
    }

    /***
     * Restores the row data to the last saved row data
     */
    async restoreData() {
        let projectID = this.props.match.params.projectID;
        let response = await fetch(`../api/displayMostRecentRowData/${projectID}`);
        //     .then(result => result.json())
        //     .then(function(newStuff) {
        //         this.setState({rowData: newStuff["rowData"], columnDefs: newStuff["columnDefs"]})
        //     }.bind(this))
    }

    /***
     * Closes the type warning modal, which is shown when a user types a non-integer value into a week
     */
    closeTypeWarningModal() {
        this.setState({ openTypeWarning: false });
    }

    /***
     * Adds the row index of the row that was just edited to this.updatedRows
     * @param event
     */
    addUpdatedRow(event) {
        let numericalInput = Number(event.value);
        let editedColumn = event.colDef.field;
        let rowIndex = event.rowIndex;
        if (isNaN(numericalInput) || numericalInput < 0) {
            let oldData = event.oldValue;
            let currentRowData = this.state.rowData;
            let currentRow = currentRowData[rowIndex];
            currentRow[editedColumn] = Number(oldData);
            this.setState({ openTypeWarning: true, rowData: currentRowData });
            event.api.refreshCells();
            return;
        }

        this.updatedRows.add({ "rowIndex": rowIndex, "colIndex": editedColumn });
    }

    /***
     * Determines if a cell is editable
     * @param event
     */
    canEditCell(event) {
        if (event.value == undefined) {
            this.setState({ openNoScheduleWarning: true });
            return;
        }
    }

    /***
     * Closes no schedule warning modal, which is created when an admin adds data to a week where a resource
     * was not working
     */
    closeNoScheduleWarningModal() {
        this.setState({ openNoScheduleWarning: false });
    }

    /*** Opens the confirmation model
     *
     */
    submitSave() {
        confirmAlert({
            title: 'Confirm To Save',
            message: 'Are you sure you want to do this?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => this.saveData()
                },
                {
                    label: 'No',
                    onClick: () => { }
                }
            ],
            closeOnEscape: true,
            closeOnClickOutside: true
        });
    };

    /***
     * Adds another week to the schedule, with the update being reflected in the database
     * @returns {Promise<void>}
     */
    async addOneWeek() {
        let projectID = this.props.match.params.projectID;
        let newData = { "ProjectID": projectID };
        let response = await fetch('../api/addOneWeek', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });
        let response2 = await fetch(`../api/displayResourceInfoPerProject/${projectID}`)
            .then(result => result.json())
            .then(data => this.processData(data))
            .then(function (newStuff) {
                this.setState({ rowData: newStuff["rowData"], columnDefs: newStuff["columnDefs"] })
            }.bind(this));

        if (moment(this.latestDate).isAfter(this.dueDate)) {
            this.addDueDateNotification();
            let updatedData = { "ProjectID": projectID, "DueDate": this.latestDate };
            await fetch('../api/updateProjectDueDate', {
                method: "PUT",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            this.dueDate = this.latestDate;
        }
    }

    /***
     * Brings up the confirmation model for adding a one week. If yes, it clicked, then
     * the grid is updated with another week
     * @returns {Promise<void>}
     */
    async submitAddOneWeek() {
        confirmAlert({
            title: 'Confirm To Add One Week',

            message: 'Are you sure you want to do this?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => this.addOneWeek()
                },
                {
                    label: 'No',
                    onClick: () => { }
                }
            ],
            closeOnEscape: true,
            closeOnClickOutside: true
        });
    }

    /***
     * Deletes another week to the schedule, with the update being reflected in the database
     * @returns {Promise<void>}
     */
    async deleteOneWeek() {
        let projectID = this.props.match.params.projectID;
        let newData = { "ProjectID": projectID };
        let response = await fetch('../api/deleteLastWeek', {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });
        fetch(`../api/displayResourceInfoPerProject/${projectID}`)
            .then(result => result.json())
            .then(data => this.processData(data))
            .then(function (newStuff) {
                this.setState({ rowData: newStuff["rowData"], columnDefs: newStuff["columnDefs"] })
            }.bind(this))
    }

    /***
     * Brings up the confirmation model for deleting a one week. If yes, it clicked, then
     * the grid is updated with another week deleted
     * @returns {Promise<void>}
     */
    async submitDeleteLastWeek() {
        confirmAlert({
            title: 'Confirm To Delete Last Week',
            message: 'Are you sure you want to do this?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => this.deleteOneWeek()
                },
                {
                    label: 'No',
                    onClick: () => { }
                }
            ],
            closeOnEscape: true,
            closeOnClickOutside: true
        });
    }

    /** Handles a change to the project status
     *
     * @param selection
     */
    handleChange(selection) {
        this.setState({ selectedOption: selection });
    }

    /*** Adds an old week to the schedule
     *
     * @returns {Promise<void>}
     */
    async addOldWeek() {
        this.currentDate = this.currentDate.subtract(7, 'days');
        let projectID = this.props.match.params.projectID;

        // TODO: perhaps cache the data so there is no need to keep on maybe API calls
        await fetch(`../api/displayResourceInfoPerProject/${projectID}`)
            .then(result => result.json())
            .then(data => this.processData(data))
            .then(function (newStuff) {
                this.setState({ rowData: newStuff["rowData"], columnDefs: newStuff["columnDefs"] })
            }.bind(this));
    }

    /*** Adds a notification when current week exceeds project due date
     *
      */
    addDueDateNotification() {
        this.notificationDOMRef.current.addNotification({
            title: "Warning",
            message: "Project Will Be Overdue",
            type: "warning",
            insert: "top",
            container: "top-right",
            animationIn: ["animated", "fadeIn"],
            animationOut: ["animated", "fadeOut"],
            dismiss: { duration: 5000 },
            dismissable: { click: true }
        });
    }

    /** Displays a comment for a schedule
     *
     * @param event
     * @returns {Promise<void>}
     */
    async displayComment(event) {
        let projectID = this.props.match.params.projectID;
        let netID = event.data.netid;
        let date = event.colDef.headerName;
        let name = event.data.name;
        let response = await fetch(`../api/getComment/${projectID}/${netID}/${date}`);
        let commentData = await response.json();
        if (commentData.length == 0) {
            return;
        }
        let comment = commentData[0]["Comment"];
        if (comment != "") {
            this.notificationDOMRef.current.addNotification({
                title: name + " For The Week Of " + date,
                message: comment,
                type: "warning",
                insert: "top",
                container: "top-right",
                animationIn: ["animated", "fadeIn"],
                animationOut: ["animated", "fadeOut"],
                dismiss: { duration: 0 },
                dismissable: { click: true }
            });
        }
    }

    /*** Closes form modal
     *
     */
    closeFormModal() {
        this.setState({ openProjectFormModal: false });
    }

    /*** Handles input change to state
     *
     * @param e
     */
    handleFormInputChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }

    /***
     * Code also will issue get request to get the comment for the respective net id and name
     * @param e
     */
    handleCommentFormInputChange(e) {
        this.setState({ [e.target.id]: e.target.value });
    }
    /*** Handle PUT Request(s) upon form being submitted
     *
     * @param event
     */
    async handleFormSubmit(event) {
        let projectID = this.props.match.params.projectID;
        let newData = {
            "ProjectID": projectID,
            "DueDate": this.state.updatedProjectDueDate,
            "StartDate": this.state.updatedProjectStartDate,
            "Technology": this.state.updatedProjectTechnology,
            "Status": this.state.selectedOption["label"],
            "ProjectName": this.state.updatedProjectName,
            "EstMaxHours": this.state.updatedProjectMaxHours
        };

        let response = await fetch('../api/updateIndividualProjectInfo', {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });

    }

    /***
     * Initializes the editProjectModal
     * @returns {Promise<void>}
     */
    async openProjectForm() {
        let projectID = this.props.match.params.projectID;
        let response = await fetch(`../api/displayProjectInfo/${projectID}`);
        let actualResponse = await response.json();
        let currentStatus = actualResponse[0]["Status"];
        this.dueDate = actualResponse[0]["DueDate"];
        let theSelectedOption = {};
        if (currentStatus == "Ongoing") {
            theSelectedOption = { label: "Ongoing", value: 1 };
        }

        else if (currentStatus == "Inactive") {
            theSelectedOption = { label: "Inactive", value: 2 };
        }

        else if (currentStatus == "Done") {
            theSelectedOption = { label: "Done", value: 3 };
        }

        else if (currentStatus == "On Hold") {
            theSelectedOption = { label: "On Hold", value: 4 };
        }

        let projectName = actualResponse[0]["ProjectName"];
        let technology = actualResponse[0]["Technology"];
        let maxHours = actualResponse[0]["EstMaxHours"];
        let startDate = actualResponse[0]["StartDate"];
        let dueDate = actualResponse[0]["DueDate"];
        this.setState({
            updatedProjectName: projectName,
            updatedProjectTechnology: technology,
            updatedProjectMaxHours: maxHours,
            updatedProjectStartDate: startDate,
            updatedProjectDueDate: dueDate,
            selectedOption: theSelectedOption,
            openProjectFormModal: true
        });
    }

    /***
     * Closes the comment view modal
     */
    closeCommentViewModal() {
        this.setState({ openCommentView: false });
    }

    /***
     * Opens the comment view modal
     */
    openCommentViewModal() {
        this.setState({
            updatedCommentUser: "",
            updatedCommentNetID: "",
            updatedCommentWeek: "",
            updatedCommentData: "", openCommentView: true
        });
    }

    /***
     * Submits the fields in the comment form using POST request
     * @returns {Promise<void>}
     */
    async handleCommentFormSubmit() {
        let projectID = this.props.match.params.projectID;
        let newData = {
            "ProjectID": projectID,
            "NetID": this.state.updatedCommentNetID["label"],
            "Dates": this.state.updatedCommentWeek["label"],
            "Comment": this.state.updatedCommentData,
        };

        // initiate PUT request to update comment in the database
        let response = await fetch('../api/updateComment', {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });
    }

    /***
     * Handles an update to the user dropdown in the comment form,
     * and narrows the remaining dropdowns accordingly
     * @param selection
     */
    handleCommentFormUserUpdate(selection) {
        let name = selection["label"];
        let netids = this.nameToNetID.get(name);
        this.resourceNetIDOptions = [];
        for (let i = 0; i < netids.length; i++) {
            this.resourceNetIDOptions.push({ label: netids[i], value: 1 });
        }
        this.setState({ updatedCommentUser: selection, updatedCommentNetID: "", updatedCommentData: "" });
    }

    /***
     * Handles an update to the netid dropdown in the comment form,
     * and narrows the remaining drop downs accordingly
     * @param selection
     */
    async handleCommentFormNetIDUpdate(selection) {
        let date = this.state.updatedCommentWeek["label"];
        let comment = "";
        if (!date == false) {
            let projectID = this.props.match.params.projectID;
            let netID = selection["label"];
            let response = await fetch(`../api/getComment/${projectID}/${netID}/${date}`);
            let comment_json = await response.json();
            comment = comment_json[0]["Comment"];
        }
        this.setState({ updatedCommentData: comment, updatedCommentNetID: selection });
    }

    /***
     * Handles an update to the week dropdown in the comment form,
     * and narrows the remaining drop downs accordingly
     * @param selection
     */
    async handleCommentFormWeekUpdate(selection) {
        let netID = this.state.updatedCommentNetID["label"];
        let name = this.state.updatedCommentUser["label"];
        let comment = "";
        if (!netID == false && !name == false) {
            let projectID = this.props.match.params.projectID;
            let date = selection["label"];
            let response = await fetch(`../api/getComment/${projectID}/${netID}/${date}`);
            let comment_json = await response.json();
            comment = comment_json[0]["Comment"];
        }
        this.setState({ updatedCommentData: comment, updatedCommentWeek: selection });
    }

    /***
     * Updates a change to the comment form
     * @param event
     */
    handleCommentFormDataUpdate(event) {
        this.setState({ updatedCommentData: event.target.value });
    }

    /***
     * Resizes the columns in the grid
     * @param event
     */
    resizeColumns(event) {
        event.api.sizeColumnsToFit();
    }

    /***
     * buttonGen() will generate the buttons that allows the admin to manipulate the GRID
     */
    buttonGen() {
        // let value = window.sessionStorage.getItem("value");
        // if (value === "logged") {
        let addResPageUrl = '/add_res_to_project/' + this.props.match.params.projectID;
        return (
            <div>
                <button style={{ height: '30px', width: '100px', marginRight: '10px', marginTop: '8px', marginLeft: '8px' }}
                    onClick={
                        this.submitSave.bind(this)
                    }
                >
                    Save
                </button>
                <button style={{ height: '30px', width: '100px', marginRight: '10px', marginTop: '8px', marginLeft: '8px' }} onClick={this.submitAddOneWeek.bind(this)}>+ Week</button>

                <button style={{ height: '30px', width: '100px', marginRight: '10px', marginTop: '8px', marginLeft: '8px' }} onClick={this.submitDeleteLastWeek.bind(this)}>- Week</button>

                <button style={{ height: '30px', width: '100px', marginRight: '15px', marginTop: '8px', marginLeft: '8px' }} onClick={this.addOldWeek.bind(this)}
                >
                    See Old Week
                </button>

                {/*<p style = {{float :'right', 'marginTop' : '7px', 'marginRight' : '10px', "font-size" : '15px'}}><b>Project Status</b></p>*/}

                <button style={{ height: '30px', width: '100px', marginRight: '15px', marginTop: '8px', marginLeft: '8px' }} onClick={this.openProjectForm.bind(this)}
                >
                    Edit Project
                </button>

                <button style={{ height: '30px', width: '100px', marginRight: '15px', marginTop: '8px', marginLeft: '8px' }} onClick={this.openCommentViewModal.bind(this)}
                >
                    Edit Comment
                </button>

                <Link to={addResPageUrl}><button style={{ height: '30px', width: '100px', marginRight: '15px', marginTop: '8px', marginLeft: '8px' }}>Add Resource</button></Link>
            </div>
        );
        // }
    }

    render() {
        let addResPageUrl = '/add_res_to_project/' + this.props.match.params.projectID;
        let projectID = this.props.match.params.projectID;
        fetch(`../api/displayProjectNameById/${this.props.match.params.projectID}`)
            .then(response => response.json())
            .then(realResponse => this.projectName = realResponse[0]["ProjectName"])
        return (
            <div>
                <h1>Project Name: {this.projectName}</h1>

                <div
                    className="ag-theme-balham"
                    style={{
                        height: '62vh',
                        width: '100vw'
                    }}
                >

                    {/* Modal that shows up when the user enters an invalid input to the grid */}
                    <Modal open={this.state.openTypeWarning} onClose={this.closeTypeWarningModal.bind(this)} center closeIconSize={14}>
                        <h3 style={{ marginTop: '15px' }}>Please Enter An Integer Greater Than Zero</h3>
                    </Modal>

                    {/* Modal where a user can edit/add a comment */}
                    <Modal open={this.state.openCommentView} onClose={this.closeCommentViewModal.bind(this)} center closeIconSize={14}>
                        <form onSubmit={this.handleCommentFormSubmit.bind(this)}>
                            <br></br>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Name:
                            <br></br>
                                <Select value={this.state.updatedCommentUser} onChange={this.handleCommentFormUserUpdate.bind(this)} options={this.resourceNameOptions}>
                                </Select>

                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                NetID:
                            <br></br>
                                <Select value={this.state.updatedCommentNetID} onChange={this.handleCommentFormNetIDUpdate.bind(this)} options={this.resourceNetIDOptions}>
                                </Select>

                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Week:
                            <br></br>
                                <Select value={this.state.updatedCommentWeek} onChange={this.handleCommentFormWeekUpdate.bind(this)} options={this.resourceDateOptions}>
                                </Select>
                            </label>

                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Comment:
                            <br></br>
                                <TextareaAutosize value={this.state.updatedCommentData} style={{ width: "100%" }} maxRows={6} onChange={this.handleCommentFormDataUpdate.bind(this)}>

                                </TextareaAutosize>

                            </label>

                            <input type="submit" value="Submit" />

                        </form>
                    </Modal>

                    {/* Modal that shows up where there is no schedule for the user */}
                    <Modal open={this.state.openNoScheduleWarning} onClose={this.closeNoScheduleWarningModal.bind(this)} center closeIconSize={14}>
                        <h3 style={{ marginTop: '15px' }}>Resource Did Not Work This Week</h3>
                    </Modal>

                    {/* Modal that shows up when the user wants to edit the project characteristics */}
                    <Modal open={this.state.openProjectFormModal} onClose={this.closeFormModal.bind(this)}
                    >
                        <form onSubmit={this.handleFormSubmit.bind(this)}>
                            <br></br>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Name:
                            <input id="updatedProjectName" style={{ float: 'right' }} type="text" required value={this.state.updatedProjectName} onChange={this.handleFormInputChange.bind(this)} />
                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Technology:
                            <input id="updatedProjectTechnology" style={{ float: 'right' }} type="text" required value={this.state.updatedProjectTechnology} onChange={this.handleFormInputChange.bind(this)} />
                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                MaxHours:
                            <input id="updatedProjectMaxHours" style={{ float: 'right' }} type="number" min="0" required value={this.state.updatedProjectMaxHours} onChange={this.handleFormInputChange.bind(this)} />
                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                StartDate:
                            <input id="updatedProjectStartDate" style={{ float: 'right' }} type="date" required value={this.state.updatedProjectStartDate}
                                    onChange={this.handleFormInputChange.bind(this)} />
                            </label>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                DueDate:
                            <input id="updatedProjectDueDate" style={{ float: 'right' }} type="date" required value={this.state.updatedProjectDueDate}
                                    onChange={this.handleFormInputChange.bind(this)} />
                            </label>
                            <br></br>
                            <label style={{ marginRight: '15px', width: '100%' }}>
                                Project Status
                            <br></br>
                                <br></br>
                                <Select value={this.state.selectedOption} onChange={this.handleChange.bind(this)} options={this.statusOptions}>
                                </Select>
                            </label>

                            <br></br>
                            <br></br>
                            <input type="submit" value="Submit" />

                        </form>
                    </Modal>

                    {/* Ref where notifications will show up */}
                    <ReactNotification ref={this.notificationDOMRef} />

                    {/* The GRID */}
                    <AgGridReact
                        columnDefs={this.state.columnDefs}
                        rowData={this.state.rowData}
                        onCellValueChanged={this.addUpdatedRow.bind(this)}
                        onCellDoubleClicked={this.displayComment.bind(this)}
                        enableCellChangeFlash={true}
                        onGridReady={this.resizeColumns.bind(this)}
                    >
                    </AgGridReact>

                    {(this.buttonGen())}

                </div>
            </div>
        );
    }
}

export default Individual_project_page