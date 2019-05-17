<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

/** Route that returns all of the rows in the projects table */
Route::get('/displayAllProjects', function () {
    return DB::table("projects")->get();
});

/** Route that returns all of the rows in the resources table */
Route::get('/displayAllResources', function() {
    return DB::table("resources")->orderBy('FirstName')->orderBy('LastName')->get();
});

/** Route that returns all of the rows in the resources_per_projects table */
Route::get('/displayResourcesPerProject', function() {
    return DB::table('resources_per_projects')->get();
});

/** Route that returns all of the rows in the schedules table */
Route::get('/displaySchedules', function() {
    return DB::table('schedules')->get();
});

/** Route that returns all general info on a given project */
Route::get('/displayProjectInfo/{projectID}', function ($projectID) {
    return DB::table("projects")->where('ProjectID', '=', $projectID)->get();
});

/** Route that returns all info on a given project (including hours) */
Route::get('/displayAllProjectInfo', function () {
    try {
        $table = DB::table('projects')
            ->leftJoin('resources_per_projects', 'projects.ProjectID', '=', 'resources_per_projects.ProjectID')
            ->select('projects.ProjectID', 'projects.ProjectName', 'projects.StartDate', 'projects.DueDate', 'projects.Status',
                'projects.Technology', 'projects.EstMaxHours', 'resources_per_projects.ScheduleID')
            ->leftJoin('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->select('projects.ProjectID', 'projects.ProjectName', 'projects.StartDate', 'projects.DueDate', 'projects.Status',
                'projects.Technology', 'projects.EstMaxHours', DB::raw('IFNULL(SUM(schedules.HoursPerWeek), 0) TotalHoursAssigned'))
            ->groupBy('projects.ProjectID')
            ->get();
        return $table;
    } catch (Exception $e){
        echo $e->getMessage();
        return response('This information could not be displayed. Please try again.', 403);
    }
});

/** Route that returns all general info on a given resource */
Route::get('/displayResourceInfo/{resourceID}', function ($resourceID) {
    return DB::table("resources")->where('resourceID', '=', $resourceID)->get();
});

/** Route that returns project Name of a given projectID */
Route::get('/displayProjectNameById/{projectID}', function ($projectID){
    return DB::table("projects")->select('ProjectName')->where('ProjectID','=',$projectID)->get();
});


/** Route that returns all projects a given resource is currently staffed on */
Route::get('/displayProjectsPerResource/{resourceID}', function ($resourceID) {
    return DB::table('resources_per_projects')
        ->rightJoin('projects', 'projects.ProjectID', '=', 'resources_per_projects.ProjectID')
        ->select('projects.ProjectName', 'resources_per_projects.Role', 'projects.Technology', 'projects.EstMaxHours', 'projects.Status', 'projects.StartDate', 'projects.DueDate')
        ->where('resources_per_projects.ResourceID', '=', $resourceID)
        ->get();
});

/** Route that returns all resources (and hours per week) working on a given project */
Route::get('/displayResourceInfoPerProject/{projectID}', function ($projectID) {
    return DB::table('resources_per_projects')
        ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
        ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
        ->select('resources.NetID', 'resources.FirstName', 'resources.LastName', 'resources_per_projects.Role', 'schedules.Dates', 'schedules.HoursPerWeek')
        ->where('resources_per_projects.ProjectID', '=', $projectID)
        ->orderBy('resources.NetID')
        ->orderBy('schedules.Dates')
        ->get();
});

/** Route that returns all resources (and hours per week) working on a given project */
Route::get('/displayResourcesPerProject/{projectID}', function ($projectID) {
    return DB::table('resources_per_projects')
        ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
        ->select('resources.NetID', 'resources.FirstName', 'resources.LastName', 'resources_per_projects.Role')
        ->where('resources_per_projects.ProjectID', '=', $projectID)
        ->orderBy('resources.FirstName')
        ->orderBy('resources.LastName')
        ->get();
});

/** Route that returns all resources not working on a given project */
Route::get('/displayResourcesAvailable/{projectID}', function ($projectID) {
    return DB::table('resources_per_projects')
        ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
        ->select('resources.NetID', 'resources.FirstName', 'resources.LastName')
        ->where('resources_per_projects.ProjectID', '!=', $projectID)
        ->groupBy('resources.NetID')
        ->get();
});

/** Route that returns all resources and their hours including and after current week */
Route::get('/displayResourceHours', function () {
    try {
        $monday = DB::select(DB::raw('select DATE(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) ) as Monday'));
        $curr_week = $monday[0]->Monday;
        $table = DB::table('resources_per_projects')
            ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
            ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->select('resources.NetID', 'resources.FirstName', 'resources.LastName', 'resources.MaxHoursPerWeek', 'schedules.Dates', 'resources.ResourceID', DB::raw('SUM(schedules.HoursPerWeek) TotalHoursPerWeek'))
            ->where('schedules.Dates', '>=', $curr_week)
            ->groupBy('resources.NetID', 'schedules.Dates')
            ->get();
        return $table;
    } catch (Exception $e){
        echo $e->getMessage();
        return response('This information could not be displayed. Please try again.', 403);
    }
});

/** Route that returns hours per project for a specific resource including and after current week */
Route::get('/displayIndividualResourceHours/{resourceID}', function ($resourceID) {
    try {
        $monday = DB::select(DB::raw('select DATE(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) ) as Monday'));
        $curr_week = $monday[0]->Monday;
        $table = DB::table('resources_per_projects')
            ->join('projects', 'projects.ProjectID', '=', 'resources_per_projects.ProjectID')
            ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->select('projects.ProjectID','projects.ProjectName', 'schedules.Dates', 'schedules.HoursPerWeek')
            ->where([['schedules.Dates', '>=', $curr_week], ['resources_per_projects.ResourceID', '=', $resourceID]])
            ->get();
        return $table;
    } catch (Exception $e){
        echo $e->getMessage();
        return response('This information could not be displayed. Please try again.', 403);
    }
});

/** Route that returns a particular comment */
Route::get('/getComment/{projectID}/{netID}/{date}', function ($projectID, $netID, $date) {
    try {
        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $netID)->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $projectID], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        $comment = DB::table('schedules')
            ->select('Comment')
            ->where([['schedules.ScheduleID', '=', $schedule_id], ['schedules.Dates', '=', $date]])
            ->get();

        return $comment;

    } catch (Exception $e){
        echo $e->getMessage();
        return response('This comment could not be returned. Please try again.', 403);
    }
});

/** Route that returns names and netids of resources working on a particular project */
Route::get('/getNames/{projectID}', function ($projectID) {
    $table = DB::table('resources_per_projects')
        ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
        ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
        ->select('resources.NetID', 'resources.FirstName', 'resources.LastName')->distinct()
        ->where('resources_per_projects.ProjectID', '=', $projectID)
        ->orderBy('resources.FirstName')
        ->orderBy('resources.LastName')
        ->get();
    return $table;
});


/** Route that adds a new project to the projects table via POST Request
{
"ProjectName": "P2",
"Technology": "T2",
"EstMaxHours": 48,
"Status": "Done",
"StartDate": "2019-03-07",
"DueDate": "2019-03-14"
}

 */
Route::post("/addProject", function(Request $request) {
    $data = $request->all();

    try {
        DB::table('projects')->insertGetId(
            ["ProjectID" => 0, "ProjectName" => $data["ProjectName"],
                "Technology" => $data["Technology"], "EstMaxHours" => $data["EstMaxHours"],
                "Status" => $data["Status"],"StartDate" => date_create($data["StartDate"]),
                "DueDate" => date_create($data["DueDate"])]
        );
        return "Successfully Added New Project";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('A project already exists with this name', 403);
            }
        }
        return response('This project could not be added. Please try again.', 403);
    }
});

/** Route that adds a new resource to the resources table via POST Request
{
"NetID": "jd111",
"FirstName": "John",
"LastName": "Doe",
"MaxHoursPerWeek": 40
}

 */
Route::post('/addResource', function(Request $request) {
    $data = $request->all();

    try {
        DB::table('resources')->insertGetId(
            ["ResourceID" => 0, "NetID" => $data["NetID"], "FirstName" => $data["FirstName"], "LastName" => $data["LastName"],
                "MaxHoursPerWeek" => $data["MaxHoursPerWeek"]]);
        return "Successfully Added New Resource";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('A resource already exists with this NetID', 403);
            }
        }
        return response('This resource could not be added. Please try again.', 403);
    }
});

/** Route that adds a new entry to the resources_per_projects table via POST request
 * ResourceID, ProjectID, ScheduleID: auto-incrementing key, so value that is inputted for it does not matter

{
"ProjectName": "P2",
"NetID": "jd111",
"Role": "Product Manager"
}

 */
Route::post('/addResourcePerProject', function(Request $request) {
    $data = $request->all();

    try {
        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $project_id_json["ProjectID"];

        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        DB::table('resources_per_projects')->insertGetId(
            ["ResourceID" => $resource_id, "ProjectID" => $project_id, "Role" => $data["Role"], "ScheduleID" => 0]);

        // adding default schedule for most recent week
        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $project_id], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        $dates = DB::table('resources_per_projects')
            ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->select('Dates')
            ->where('resources_per_projects.ProjectID', '=', $project_id)
            ->distinct()
            ->get();
//        echo($dates);
        foreach($dates as $d){
            DB::table('schedules')->insert(['ScheduleID' =>  $schedule_id, 'Dates' => $d->Dates, 'HoursPerWeek' => 0, 'Comment' => ""]);
        }

        return ("Successfully Added New ResourcePerProject");
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                echo($e->getMessage());
                return response('This resource is already working on this project', 403);
            }
        }
        echo($e->getMessage());
        return response('The resource could not be added to this project. Please try again.', 403);
    }
});

/** Route that adds a new entry to the schedules table
{
"ProjectName": "P2",
"NetID": "jd111",
"Dates": "2019-03-07",
"HoursPerWeek": 30
}

 */
Route::post('/addSchedule', function(Request $request) {
    $data = $request->all();
    try {
        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $project_id_json["ProjectID"];

        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $project_id], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        DB::table('schedules')->insertGetId(
            ["ScheduleID" => $schedule_id, "Dates" => date_create($data["Dates"]),
                "HoursPerWeek" => $data["HoursPerWeek"], "Comment" => ""]);
        return "Successfully Added New Schedule";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('This resource already has hours for this week on this project', 403);
            }
        }
        return response('This entry could not be added. Please try again.', 403);
    }
});

/** Route that adds a new week to the schedules table via POST Request
{
"ProjectID": "25"
}

 */
Route::post("/addOneWeek", function(Request $request) {
    $data = $request->all();
    try {

//        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
//        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $data["ProjectID"];

        $num_resources = DB::table('resources_per_projects')
            ->where('resources_per_projects.ProjectID', '=', $project_id)
            ->count();
        $num_weeks = DB::table('resources_per_projects')
            ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->where('resources_per_projects.ProjectID', '=', $project_id)
            ->count();

        if ($num_resources < 1) {
            return response('Add a resource before adding a week', 403);
        } elseif ($num_weeks < 1) {
            // JSON array containing the most recent Monday
            $monday = DB::select(DB::raw('select DATE(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) ) as LastMonday'));
            $ids = DB::table('resources_per_projects')->select('ScheduleID')
                ->where('resources_per_projects.ProjectID', '=', $project_id)->get();
            foreach($ids as $i){
                $date = $monday[0];
                DB::table('schedules')->insert(['ScheduleID' =>  $i->ScheduleID, 'Dates' => $date->LastMonday, 'HoursPerWeek' => 40, "Comment" => ""]);
            }
            return response("Successfully inserted first week", 200);
        } else {

            $last_week = DB::table('resources_per_projects')
                ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
                ->where('resources_per_projects.ProjectID', '=', $project_id)->max('Dates');
//            return $last_week;
            $monday = DB::select(DB::raw('SELECT DATE_ADD("'. $last_week . '", INTERVAL 7 DAY) AS Monday'));
//            return $monday;
            $ids = DB::table('resources_per_projects')->select('ScheduleID')
                ->where('resources_per_projects.ProjectID', '=', $project_id)->get();
//            echo($ids);
            foreach($ids as $i){
                $date = $monday[0];
                $hours_array = DB::table('schedules')->select('HoursPerWeek')
                    ->where([['ScheduleID', $i->ScheduleID], ["Dates", $last_week]])->get();
                $prev_hours = (count($hours_array) > 0 ? $hours_array[0]->HoursPerWeek : 40);
                DB::table('schedules')->insert(['ScheduleID' =>  $i->ScheduleID, 'Dates' => $date->Monday, 'HoursPerWeek' => $prev_hours, "Comment" => ""]);
            }
            return response("Successfully inserted next week", 200);
        }

    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('A project already exists with this name', 403);
            }
        }
        echo($e->getMessage());
        return response('This project could not be added. Please try again.', 403);
    }
});

/** Route that deletes the last week in the schedules table

{
"ProjectID": "25"
}

 */
Route::delete('/deleteLastWeek', function(Request $request) {
    $data = $request->all();
    try {
        $project_id = $data["ProjectID"];
        $last_week = DB::table('resources_per_projects')
            ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
            ->where('resources_per_projects.ProjectID', '=', $project_id)->max('Dates');
        DB::table('schedules')->where('Dates', $last_week)->delete();

        return "Successfully Deleted Last Week";
    } catch (Exception $e){
        return response('This week could not be deleted. Please try again.', 403);
    }
});

/** Route that updates a project in the projects table
 * ProjectID: auto-incrementing key, so value that is inputted for it does not matter

{
"OldProjectName": "P2",
"NewProjectName": "P2'",
"Technology": "T2",
"EstMaxHours": 48,
"Status": "Done",
"StartDate": "2019-03-07",
"DueDate": "2019-03-14"
}

 */
Route::put('/updateProject', function(Request $request) {
    $data = $request->all();
    try {
        DB::table('projects')->where('ProjectName', $data["OldProjectName"])->update(
            ["ProjectName" => $data["NewProjectName"], "Technology" => $data["Technology"],
                "EstMaxHours" => $data["EstMaxHours"], "Status" => $data["Status"],
                "StartDate" => $data["StartDate"], "DueDate" => $data["DueDate"]]);
        return "Successfully Updated Existing Project";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('A project already exists with this name', 403);
            }
        }
        return response('This project could not be updated. Please try again.', 403);
    }
});

/** Route that updates a resource in the resources table
 * ResourceID: auto-incrementing key, so value that is inputted for it does not matter

{
"OldNetID": "jd111",
"NewNetID": "jd111",
"FirstName": "John",
"LastName": "Doe",
"MaxHoursPerWeek": 40
}

 */
Route::put('/updateResource', function(Request $request) {
    $data = $request->all();
    try {
        DB::table('resources')->where('NetID', '=', $data["OldNetID"])->update(
        ["NetID" => $data["NewNetID"], "FirstName" => $data["FirstName"],
        "LastName" => $data["LastName"], "MaxHoursPerWeek" => $data["MaxHoursPerWeek"]]);
        return "Successfully Updated Existing Resource";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('A resource already exists with this netID', 403);
            }
        }
        return response('This resource could not be updated. Please try again.', 403);
    }
});

/** Route that updates an entry to the resources_per_projects table
 * ResourceID, ProjectID, ScheduleID: auto-incrementing key, so value that is inputted for it does not matter

{
"ProjectName": "P2",
"NetID": "jd111",
"Role": "Product Manager"
}

 */
Route::put('/updateResourcePerProject', function(Request $request) {
    $data = $request->all();

    $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
    $project_id_json = json_decode(json_encode($project_id_array{0}), true);
    $project_id = $project_id_json["ProjectID"];

    $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
    $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
    $resource_id = $resource_id_json["ResourceID"];

    try {
        DB::table('resources_per_projects')->where([['ProjectID', $project_id], ['ResourceID', $resource_id]])->update(
            ["Role" => $data["Role"]]);
        return "Successfully Updated Existing ResourcePerProject";
    } catch (Exception $e){
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('This resource already exists on this project', 403);
            }
        }
        return response('This resource could not be updated. Please try again.', 403);
    }
});


//{
//    "ProjectID": 25,
//    "NetID": "jd111",
//    "Dates": "2019-03-07",
//    "HoursPerWeek": 30
//}

Route::put('/updateSchedule', function(Request $request) {
    $data = $request->all();

    try {
        $project_id = $data["ProjectID"];
        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $project_id], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        $updateDetails = array("HoursPerWeek" => $data["HoursPerWeek"]);
        DB::table('schedules')->where([['ScheduleID', $schedule_id], ["Dates", $data["Dates"]]])->update($updateDetails);
        return "Successfully Updated Existing Schedule";
    } catch (Exception $e){
        echo($e->getMessage());
        if ($e instanceof \Illuminate\Database\QueryException) {
            $error_code= $e->errorInfo[1];
            if($error_code == 1062){
                return response('This resource already has hours for this week on this project', 403);
            }
        }
        return response('This entry could not be updated. Please try again.', 403);
    }
});

/** Route that deletes a  project in the projects table
 * ProjectID: auto-incrementing key, so value that is inputted for it does not matter

{
"ProjectName": "P2"
}

 */
Route::delete("/deleteProject", function(Request $request) {
    $data = $request->all();

    try {
        // Removing Resources Per Projects
        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $project_id_json["ProjectID"];

        $matching_schedules = DB::table('resources_per_projects')->where("ProjectID", "=", $project_id)->pluck('ScheduleID');

        foreach ($matching_schedules as $scheduleID) {
            DB::table('schedules')->where("ScheduleID" , "=", $scheduleID)->delete();
        }

        DB::table('resources_per_projects')->where("ProjectID", "=", $project_id)->delete();
        DB::table('projects')->where("ProjectID" ,"=", $project_id)->delete();
        return "Successfully Deleted Existing Project";
    } catch (Exception $e){
        return response('This project could not be deleted. Please try again.', 403);
    }
});

/** Route that deletes a resource in the resource table
 * ProjectID: auto-incrementing key, so value that is inputted for it does not matter

{

"NetID": "jd111"
}
 *

 */
Route::delete("/deleteResource", function(Request $request) {
    $data = $request->all();
    try {
        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $matching_schedules = DB::table('resources_per_projects')->where("ResourceID", "=", $resource_id)->pluck('ScheduleID');

        foreach ($matching_schedules as $scheduleID) {
            DB::table('schedules')->where("ScheduleID", "=", $scheduleID)->delete();
        }

        DB::table('resources_per_projects')->where("ResourceID", "=", $resource_id)->delete();
        DB::table('resources')->where("ResourceID" ,"=", $resource_id)->delete();
        return "Successfully Deleted Existing Resource";

    } catch (Exception $e){
        return response('This resource could not be deleted. Please try again.', 403);
    }
});

/** Route that deletes a resource in the resource table
 * ProjectID: auto-incrementing key, so value that is inputted for it does not matter

{
"ProjectName" : P1
"NetID": "jd111"
}
 *

 */
Route::delete("/deleteResourcePerProject", function(Request $request) {
    $data = $request->all();
    try {
        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $project_id_json["ProjectID"];

        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $matching_schedules =
            DB::table('resources_per_projects')->where([["ResourceID", "=", $resource_id], ["ProjectID", "=", $project_id]])->pluck('ScheduleID');

        foreach ($matching_schedules as $scheduleID) {
            DB::table('schedules')->where("ScheduleID", "=", $scheduleID)->delete();
        }

        DB::table('resources_per_projects')->where([["ResourceID", "=", $resource_id], ["ProjectID", "=", $project_id]])->delete();
        return "Successfully Deleted Existing ResourcePerProject";

    } catch (Exception $e){
        return response('This resource could not be removed from this project. Please try again.', 403);
    }
});

/** Route that deletes a resource in the resource table
 * ProjectID: auto-incrementing key, so value that is inputted for it does not matter

{
"ProjectName" : P1,
"NetID": "jd111",
"Dates" : 2019-04-01
}*/
Route::delete("/deleteSchedule", function(Request $request) {
    $data = $request->all();

    try {
        $project_id_array = DB::table('projects')->select('ProjectID')->where('ProjectName', '=', $data["ProjectName"])->get();
        $project_id_json = json_decode(json_encode($project_id_array{0}), true);
        $project_id = $project_id_json["ProjectID"];

        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $project_id], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        DB::table('schedules')->where([["ScheduleID", "=", $schedule_id], ["Dates", "=", $data["Dates"]]])->delete();

        return "Successfully Deleted Existing Schedule";

    } catch (Exception $e){
        return response('This entry could not be deleted. Please try again.', 403);
    }
});

$mostRecentData = null;
$currentProjectID = null;
Route::put("/updateMostRecentRowData", function(Request $request) {
    global $mostRecentData, $currentProjectID;
    $data = $request->all();
    $mostRecentData = $data["data"];
    $currentProjectID = $data["projectID"];
    echo($mostRecentData);
});

Route::get("/displayMostRecentRowData/{projectID}", function($projectID) {
    global $mostRecentData, $currentProjectID;
    if ($mostRecentData == null || $currentProjectID == null ||$projectID != $currentProjectID) {
        return response("No Reversion Detected", 200);
    }
    return response($mostRecentData, 200);
});

Route::put("/updateProjectDueDate", function(Request $request) {
    try {
        $data = $request->all();
        DB::table('projects')->where('ProjectID' ,"=", $data["ProjectID"])->update(["DueDate" => $data["DueDate"]]);
        return response("Successfully Updated Project Due Date", 403);
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }

});

/***
 * {
 * ProjectID: projectID,
 * NetID: netID,
 * Dates: date,
 * Comment: comment
 * }
 */
Route::put("/updateComment", function(Request $request) {
    try {
        $data = $request->all();

        $project_id = $data["ProjectID"];

        $resource_id_array = DB::table('resources')->select('ResourceID')->where('NetID', '=', $data["NetID"])->get();
        $resource_id_json = json_decode(json_encode($resource_id_array{0}), true);
        $resource_id = $resource_id_json["ResourceID"];

        $schedule_id_array = DB::table('resources_per_projects')->select('ScheduleID')->where([['ProjectID', '=', $project_id], ['ResourceID', '=', $resource_id]])->get();
        $schedule_id_json = json_decode(json_encode($schedule_id_array{0}), true);
        $schedule_id = $schedule_id_json["ScheduleID"];

        DB::table('schedules')->where([['ScheduleID' ,"=", $schedule_id], ['Dates', "=", $data["Dates"]]])->update(["Comment" => $data["Comment"]]);
        return response("Successfully Updated Comment", 200);
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }

});

/***
 * {
 * ProjectID: projectID
 * ProjectName: projectName
 * }
 */
Route::put("/updateProjectName", function(Request $request) {
    try {
        $data = $request->all();
        DB::table("projects")->where('ProjectID', "=", $data["ProjectID"])->update(["ProjectName" => $data["ProjectName"]]);
        return "Successfully Updated Project Name";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }

});

/***
 * {
 * ProjectID: projectID
 * Technology: technology
 * }
 */
Route::put("/updateProjectTechnology", function(Request $request) {
    try {
        $data = $request->all();
        DB::table("projects")->where('ProjectID', "=", $data["ProjectID"])->update(["Technology" => $data["Technology"]]);
        return "Successfully Updated Project Technology";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }
});

/***
 * {
 * ProjectID: projectID
 * EstMaxHours: max hours
 * }
 *
 */
Route::put("/updateProjectMaxHours", function(Request $request) {
    try {
        $data = $request->all();
        DB::table("projects")->where('ProjectID', "=", $data["ProjectID"])->update(["EstMaxHours" => $data["EstMaxHours"]]);
        return "Successfully Updated Project Max Hours";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }
});

/***
 * {
 * ProjectID: projectID
 * StartDate: start date
 * }
 *
 */
Route::put("/updateProjectStartDate", function(Request $request) {
    try {
        $data = $request->all();
        DB::table("projects")->where('ProjectID', "=", $data["ProjectID"])->update(["StartDate" => $data["StartDate"]]);
        return "Successfully Updated Project Start Date";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }
});

/***
 * {
 * ProjectID: projectID
 * DueDate: due date
 * }
 *
 */
Route::put("/updateProjectDueDate", function(Request $request) {
    try {
        $data = $request->all();
        DB::table("projects")->where('ProjectID', "=", $data["ProjectID"])->update(["DueDate" => $data["DueDate"]]);
        return "Successfully Updated Project Due Date";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }

});

/***
 * {ProjectID : projectID (integer), Status: status (string)}
 */
Route::put("/updateProjectStatus", function(Request $request) {
    try {
        $data = $request->all();
        DB::table('projects')->where('ProjectID', $data["ProjectID"])->update(
            ["Status" => $data["Status"]]);
        return "Successfully Updated Project Status";
    } catch (Exception $e){
        return response('This field could not be updated. Please try again.', 403);
    }
});

/***
 * {
 * ProjectID: projectID
 * DueDate: due date
 * EstMaxHours: max hours
 * ProjectName: projectName
 * StartDate: start date
 * Technology: technology
 * Status: status
 * }
 *
 */
Route::put("/updateIndividualProjectInfo", function(Request $request) {
    try {
        $data = $request->all();
        DB::table('projects')->where('ProjectID', "=", $data["ProjectID"])->update(
            ["Status" => $data["Status"], "DueDate" => $data["DueDate"],
                "StartDate" => $data["StartDate"], "EstMaxHours" => $data["EstMaxHours"],
                "Technology" => $data["Technology"], "ProjectName" => $data["ProjectName"]]);
        return "Successfully Updated Data";
    } catch (Exception $e){
        return response('This entry could not be updated. Please try again.', 403);
    }

});

/** Route that returns all comments for a particular project */
/** Route that returns all comments for a particular project */
Route::get('/getComments/{projectID}', function ($projectID) {
    $table = DB::table('resources_per_projects')
        ->join('resources', 'resources.ResourceID', '=', 'resources_per_projects.ResourceID')
        ->join('schedules', 'resources_per_projects.ScheduleID', '=', 'schedules.ScheduleID')
        ->select('resources.NetID', 'schedules.Dates', 'schedules.Comment')->distinct()
        ->where([['resources_per_projects.ProjectID', '=', $projectID], ['schedules.Comment', '<>', ""]])
        ->get();
    return $table;
});

