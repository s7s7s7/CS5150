import React from 'react'
import { Link } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import Modal from 'react-responsive-modal';
import Select from 'react-select';

class Resource_list_page extends React.Component {
	/** Constructor that is called when component is initialized.
	 *  Entry point of this component
	 *	@param props
	 */
	constructor(props) {
		super(props);
		this.state = {
			showAddPopup: false,
			showDeletePopup: false,
			columnDefs: [],
			// state variables needed for resource form
			rowData: [],
			selectedResource: {},
			selectedResourceID: '',
			firstName: '',
			lastName: '',
			netID: '',
			maxHourPerWeek: 0
		};
		this.resourceOptions = [];

		this.handleFirstNameChange = this.handleFirstNameChange.bind(this);
		this.handleLastNameChange = this.handleLastNameChange.bind(this);
		this.handleNetIDChange = this.handleNetIDChange.bind(this);
		this.handleMaxHourChange = this.handleMaxHourChange.bind(this);
		this.handleAddSubmit = this.handleAddSubmit.bind(this);
		this.handleNameSelect = this.handleNameSelect.bind(this);
		this.handleDeleteSubmit = this.handleDeleteSubmit.bind(this);
	}

	/**
	 * Toggle add popup window on the page
	 * @returns {Promise<void>}
	 */
	toggleAddPopup() {
		this.setState({
			showAddPopup: !this.state.showAddPopup
		});
	}

	/**
	 * Toggle delete popup window on the page
	 * @returns {Promise<void>}
	 */
	toggleDeletePopup() {
		this.setState({
			showDeletePopup: !this.state.showDeletePopup
		});
	}

	/**
	 * Function processes cleans up data from the api call.
	 * The passed in data params contains all resources that have hour assigned.
	 * It makes a GET request to the api (argument to the fetch function),
	 * retrieves it, then processes the data using processData to create new row
	 * data and column definitions, and then updates the state to those values.
	 * That is why when you load this page, it starts off empty and then data
	 * populates the grid. It is called once, immediately after render() is first
	 * called.
	 * @param data
	 * @returns {{rowData: Array, columnDefs: [], resources: []}}, where rowData
	 * is the data to be placed in the grid, and columnDefs is the names of each
	 * of the individual columns, resources is the names of resources
	 */
	async processData(data) {
		// console.log(data);
		// define column heades
		let columnDefs = [{
			headerName: 'NetID',
			field: 'netid',
			width: 100,
			filter: "agTextColumnFilter",
			suppressMovable: true,
			pinned: 'left',
			sortable: true,
		}, {
			headerName: 'Name',
			field: 'name',
			width: 160,
			filter: "agTextColumnFilter",
			suppressMovable: true,
			pinned: 'left'
		}, {
			headerName: 'Max Hours Per Week',
			width: 170,
			field: 'maxHourPerWeek',
			filter: "agTextColumnFilter",
			suppressMovable: true,
			pinned: 'left'
		}, {
			headerName: 'Details',
			field: 'detailLink',
			width: 100,
			filter: "agTextColumnFilter",
			suppressMovable: true,
			pinned: 'left',
			cellRenderer: function (params) {
				return "<a href='/individual_resource/" + params.value + "'>Details</a>"
			}
		}]

		let rowData = [];  // row data in the grid
		let currJSON = {};  // temp store of json of data
		let prevNetId = null;  // previous processed netID
		let colNames = new Set();  // column header
		let netIDs = new Set();  // a set of seen netIDs
		let resources = [];  // names of resources

		// process data for the first time
		for (let i = 0; i < data.length; i++) {
			let curr = data[i];
			let currID = curr.NetID;
			let currHeader = curr.Dates;
			let fullName = curr.FirstName + " " + curr.LastName;
			let maxHour = curr.MaxHoursPerWeek;
			let id = curr.ResourceID;
			console.log(maxHour);

			if (currID != prevNetId) {
				// a new resource
				if (prevNetId != null) {
					rowData.push(currJSON);
				}
				prevNetId = currID;
				currJSON = {
					netid: currID,
					name: fullName,
					maxHourPerWeek: maxHour,
					detailLink: id
				};
				resources.push(fullName);
				netIDs.add(currID);
				let tempName = fullName + " (" + currID + ")";
				this.resourceOptions.push({ label: tempName, value: currID });
			}
			let currHours = curr.TotalHoursPerWeek;
			if (!colNames.has(currHeader)) {
				colNames.add(currHeader);
				let newColDef = {
					headerName: currHeader,
					field: currHeader,
					sortable: true,
					filter: "agTextColumnFilter",
					suppressMovable: true,
					cellStyle: function (params) {
						if (params.value > params.data.maxHourPerWeek) {
							return { color: 'red' };
						} else if (params.value < params.data.maxHourPerWeek) {
							return { color: 'green' };
						} else {
							return null;
						}
					}
				};
				columnDefs.push(newColDef);
			}
			currJSON[currHeader] = currHours;
		}
		rowData.push(currJSON);

		// sort the dates
		let dates = columnDefs.slice(3);
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

		// second api call to get all resources
		let response = await fetch('../api/displayAllResources');
		let data_ = await response.json();

		for (let j = 0; j < data_.length; j++) {
			let curr_ = data_[j];
			let currID_ = curr_.NetID;
			if (!netIDs.has(currID_)) {
				// current resource not in the netIDs set, then has no hour assigned
				let fullName_ = curr_.FirstName + " " + curr_.LastName;
				let maxHour_ = curr_.MaxHoursPerWeek;
				let id_ = curr_.ResourceID;
				currJSON = {
					netid: currID_,
					name: fullName_,
					maxHourPerWeek: maxHour_,
					detailLink: id_
				};
				rowData.push(currJSON);
				resources.push(fullName_);
				let tempName = fullName_ + " (" + currID_ + ")";
				this.resourceOptions.push({ label: tempName, value: currID_ });
			}
		}
		// return the combined the data
		return { "rowData": rowData, "columnDefs": columnDefs, "resources": resources };
	}

	/**
	 * This function is always called right after the constructor for this class
	 * is called, and the component is loaded onto a screen via render().
	*/
	componentDidMount() {
		fetch('../api/displayResourceHours')
			.then(result => result.json())
			.then(data => this.processData(data))
			.then(function (newData) {
				this.setState({
					rowData: newData["rowData"],
					columnDefs: newData["columnDefs"],
					resourceList: newData["resources"]
				})
			}.bind(this));
	}

	/**
	 * Functions that handles firstName changes on the form
	 * @param: event
	 * @returns {Promise<void>}
	*/
	handleFirstNameChange(event) {
		this.setState({
			firstName: event.target.value
		});
	}

	/**
	 * Functions that handles lastName changes on the form
	 * @param: event
	 * @returns {Promise<void>}
	*/
	handleLastNameChange(event) {
		this.setState({
			lastName: event.target.value
		});
	}

	/**
	 * Functions that handles netID changes on the form
	 * @param: event
	 * @returns {Promise<void>}
	*/
	handleNetIDChange(event) {
		this.setState({
			netID: event.target.value
		});
	}

	/**
	 * Functions that handles maxHour changes on the form
	 * @param: event
	 * @returns {Promise<void>}
	*/
	handleMaxHourChange(event) {
		this.setState({
			maxHourPerWeek: event.target.value
		});
	}

	/**
	 * Functions that handles name seleted changes on the form
	 * @param: event
	 * @returns {Promise<void>}
	*/
	handleNameSelect(event) {
		this.setState({
			selectedResource: event,
			selectedResourceID: event["value"]
		});
	}

	/**
	 * Function that handles form submition for adding new resource
	 * @param: event
	 * @returns {Promise<void>}
	 */
	async handleAddSubmit(event) {
		// console.log("handling add submit");

		// retrieveing and assigning data
		let data = {
			"NetID": this.state.netID,
			"FirstName": this.state.firstName,
			"LastName": this.state.lastName,
			"MaxHoursPerWeek": this.state.maxHourPerWeek
		}
		// console.log(data);

		// api call to update the database with new data
		let response = await fetch('../api/addResource', {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
		});
	}

	/**
	 * Function that handles form submition for deleting existing resource
	 * @param: event
	 * @returns {Promise<void>}
	 */
	async handleDeleteSubmit(event) {
		let data = { "NetID": this.state.selectedResourceID };

		// api call to update the database
		let response = await fetch('../api/deleteResource', {
			method: "DELETE",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
	}

	/**
	 * Function that shows and hides the buttons based on authentications
	 */
	buttonGen() {
		// if (window.sessionStorage.getItem("value") == "logged") {
		return (
			<div>
				<button
					style={{ height: '30px', width: '100px', marginRight: '10px' }}
					onClick={this.toggleAddPopup.bind(this)}>
					Add Resource</button>
				<button
					style={{ height: '30px', width: '125px', marginRight: '10px' }}
					onClick={this.toggleDeletePopup.bind(this)}
				>Delete Resource</button>
			</div>
		);
		// }
	}

	render() {
		return (
			<div
				className="ag-theme-balham"
				style={{
					height: '62vh',
					width: '100vw'
				}}
			>
				<AgGridReact
					columnDefs={this.state.columnDefs}
					rowData={this.state.rowData}
				></AgGridReact>

				<Modal open={this.state.showAddPopup} onClose={this.toggleAddPopup.bind(this)} center closeIconSize={14}>
					<h4 style={{ marginTop: '15px' }}>Add a New Resource</h4>
					<form onSubmit={this.handleAddSubmit}>
						<label style={{ marginRight: '15px' }}>First Name:</label>
						<input style={{ float: 'right' }} type="text" required value={this.state.firstName} onChange={this.handleFirstNameChange} />
						<br></br>
						<label style={{ marginRight: '15px' }}>Last Name:</label>
						<input style={{ float: 'right' }} type="text" required value={this.state.lastName} onChange={this.handleLastNameChange} />
						<br></br>
						<label style={{ marginRight: '15px' }}>netID:</label>
						<input style={{ float: 'right' }} type="text" required value={this.state.netID} onChange={this.handleNetIDChange} />
						<br></br>
						<label style={{ marginRight: '15px' }}>Max Hours per Week:</label>
						<input style={{ float: 'right' }} type="number" min="0" required value={this.state.maxHourPerWeek} onChange={this.handleMaxHourChange} />
						<br></br>
						<input type="submit" value="Submit" />
					</form>
				</Modal>

				<Modal open={this.state.showDeletePopup} onClose={this.toggleDeletePopup.bind(this)} center closeIconSize={14}>
					<h4 style={{ marginTop: '15px' }}>Delete a Resource</h4>
					<form onSubmit={this.handleDeleteSubmit}>
						<label style={{ marginRight: '15px', width: '100%' }}>
							Name:
								<br></br>
							<Select
								value={this.state.selectedResource}
								onChange={this.handleNameSelect.bind(this)}
								options={this.resourceOptions}>
							</Select>
						</label>
						<br></br>
						<input type="submit" value="Submit" />
					</form>
				</Modal>

				{/*
				<button
					style={{ height: '30px', width: '100px', marginRight: '10px' }}
					onClick={this.toggleAddPopup.bind(this)}
				>Add Resource</button>
				<button
					style={{ height: '30px', width: '125px', marginRight: '10px' }}
					onClick={this.toggleDeletePopup.bind(this)}
				>Delete Resource</button>
				*/}
				{this.buttonGen()}
			</div>
		);
	}
}

export default Resource_list_page

if (document.getElementById('resources')) {
	ReactDOM.render(<ResourceListPage />, document.getElementById('Resource_list_page'));
}
