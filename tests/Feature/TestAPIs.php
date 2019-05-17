<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class TestAPIs extends TestCase
{

    use DatabaseTransactions;

    /**
     * A basic feature test example.
     *
     * @return void
     */
    public function testExample()
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_displayAllProjects()
    {
        $response = $this->get('api/displayAllProjects');

        $structure = ['*' => ['ProjectID', 'ProjectName', 'Status', 'Technology', 'StartDate', 'DueDate', 'EstMaxHours']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayAllResources()
    {
        $response = $this->get('api/displayAllResources');

        $structure = ['*' => ['ResourceID', 'FirstName', 'LastName', 'MaxHoursPerWeek', 'NetID']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourcesPerProject()
    {
        $response = $this->get('api/displayResourcesPerProject');

        $structure = ['*' => ['ResourceID', 'ProjectID', 'Role', 'ScheduleID']];
        $response->assertJsonStructure($structure);
    }

    public function test_displaySchedules()
    {
        $response = $this->get('api/displaySchedules');

        $structure = ['*' => ['ScheduleID', 'Dates', 'HoursPerWeek']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayProjectInfo()
    {
        $response = $this->get('api/displayProjectInfo/{projectID}');

        $structure = ['*' => ['ProjectID', 'ProjectName', 'Status', 'Technology', 'StartDate', 'DueDate', 'EstMaxHours']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayAllProjectInfo()
    {
        $response = $this->get('api/displayAllProjectInfo');

        $structure = ['*' => ['ProjectName', 'Status', 'Technology', 'StartDate', 'DueDate', 'EstMaxHours', 'TotalHoursAssigned']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourceInfo()
    {
        $response = $this->get('api/displayResourceInfo/{resourceID}');

        $structure = ['*' => ['ResourceID', 'FirstName', 'LastName', 'MaxHoursPerWeek', 'NetID']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayProjectNameById()
    {
        $response = $this->get('api/displayProjectNameById/{projectID}');

        $structure = ['*' => ['ProjectName']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayProjectsPerResource()
    {
        $response = $this->get('api/displayProjectsPerResource/{resourceID}');

        $structure = ['*' => ['ProjectName', 'Status', 'Technology', 'StartDate', 'DueDate', 'EstMaxHours', 'Role']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourceInfoPerProject()
    {
        $response = $this->get('api/displayResourceInfoPerProject/{resourceID}');

        $structure = ['*' => ['NetID', 'FirstName', 'LastName', 'Role', 'Dates', 'HoursPerWeek']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourcesPerProject_id()
    {
        $response = $this->get('api/displayResourcesPerProject/{projectID}');

        $structure = ['*' => ['NetID', 'FirstName', 'LastName', 'Role']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourcesAvailable()
    {
        $response = $this->get('api/displayResourcesAvailable/{projectID}');

        $structure = ['*' => ['NetID', 'FirstName', 'LastName']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayResourceHours()
    {
        $response = $this->get('api/displayResourceHours');

        $structure = ['*' => ['NetID', 'FirstName', 'LastName', 'MaxHoursPerWeek', 'Dates', 'ResourceID', 'TotalHoursPerWeek']];
        $response->assertJsonStructure($structure);
    }

    public function test_displayIndividualResourceHours()
    {
        $response = $this->get('api/displayIndividualResourceHours/{resourceID}');

        $structure = ['*' => ['ProjectName', 'Dates', 'HoursPerWeek']];
        $response->assertJsonStructure($structure);
    }

//    public function test_getComment()
//    {
//        $response = $this->get('api/getComment/{projectID}/{netID}/{date}');
//
//        $structure = ['*' => ['Comment']];
//        $response->assertJsonStructure($structure);
//    }

    public function test_getNames()
    {
        $response = $this->get('api/getNames/{projectID}');

        $structure = ['*' => ['FirstName', 'LastName', 'NetID']];
        $response->assertJsonStructure($structure);
    }


    public function test_addProject()
    {
        $structure = ['ProjectName' => 'P99', 'Technology' => 'T99', 'EstMaxHours' => 100, 'Status' => 'Ongoing',
            'StartDate' => '2019-04-07', 'DueDate' => '2019-06-14'];
        $response = $this->json('POST', 'api/addProject', $structure);

        $str = "Successfully Added New Project";
        $response->assertSeeText($str);
    }

    public function test_addResource()
    {
        $structure = ['NetID' => 'am2243', 'FirstName' => 'Ayush', 'LastName' => 'Mittal', 'MaxHoursPerWeek' => 50];
        $response = $this->json('POST', 'api/addResource', $structure);

        $str = "Successfully Added New Resource";
        $response->assertSeeText($str);
    }

//    public function test_addResourcePerProject()
//    {
//        $structure = ['ProjectName' => 'P4', 'NetID' => 'jb007', 'Role' => 'Programmer'];
//        $response = $this->json('POST', 'api/addResourcePerProject', $structure);
//
//        $str = "Successfully Added New ResourcePerProject";
//        $response->assertSeeText($str);
//    }

//    public function test_addSchedule()
//    {
//        $structure = ['NetID' => 'jb007', 'ProjectName' => 'P4', 'Dates' => '2019-4-29', 'HoursPerWeek' => 20];
//        $response = $this->json('POST', 'api/addSchedule', $structure);
//
//        $str = "Successfully Added New Schedule";
//        $response->assertSeeText($str);
//    }

    public function test_addOneWeek()
    {
        $structure = ['ProjectID' => 1];
        $response = $this->json('POST', 'api/addOneWeek', $structure);

        $str = "Successfully inserted next week";
        $response->assertSeeText($str);
    }

    public function test_updateProject()
    {
        $structure = ['OldProjectName' => 'P2', 'NewProjectName' => 'P2', 'Technology' => 'T2', 'EstMaxHours' => 200,
            'Status' => 'Done', 'StartDate' => "2019-03-07", 'DueDate' => "2019-03-14"];
        $response = $this->json('PUT', 'api/updateProject', $structure);

        $str = "Successfully Updated Existing Project";
        $response->assertSeeText($str);
    }

    public function test_updateResource()
    {
        $structure = ['OldNetID' => 'jd111', 'NewNetID' => 'jd111', 'FirstName' => 'Joe', 'LastName' => 'Doe',
            'MaxHoursPerWeek' => 30];
        $response = $this->json('PUT', 'api/updateResource', $structure);

        $str = "Successfully Updated Existing Resource";
        $response->assertSeeText($str);
    }

    public function test_updateResourcePerProject()
    {
        $structure = ['ProjectName' => 'P4', 'NetID' => 'jd111', 'Role' => 'Programmer'];
        $response = $this->json('PUT', 'api/updateResourcePerProject', $structure);

        $str = "Successfully Updated Existing ResourcePerProject";
        $response->assertSeeText($str);
    }

    public function test_updateSchedule()
    {
        $structure = ['ProjectID' => 1, 'NetID' => 'jd111', 'Dates' => '2019-4-29', 'HoursPerWeek' => 50];
        $response = $this->json('PUT', 'api/updateSchedule', $structure);

        $str = "Successfully Updated Existing Schedule";
        $response->assertSeeText($str);
    }

    public function test_updateComment()
    {
        $structure = ['ProjectID' => 1, 'NetID' => 'jd111', 'Dates' => '2019-4-29', 'Comment' => "test case comment"];
        $response = $this->json('PUT', 'api/updateComment', $structure);

        $str = "Successfully Updated Comment";
        $response->assertSeeText($str);
    }

    public function test_deleteProject()
    {
        $structure = ['ProjectName' => "P3"];
        $response = $this->json('DELETE', 'api/deleteProject', $structure);

        $str = "Successfully Deleted Existing Project";
        $response->assertSeeText($str);
    }

    public function test_deleteResource()
    {
        $structure = ['NetID' => "jd111"];
        $response = $this->json('DELETE', 'api/deleteResource', $structure);

        $str = "Successfully Deleted Existing Resource";
        $response->assertSeeText($str);
    }

    public function test_deleteResourcePerProject()
    {
        $structure = ['ProjectName' => 'P4', 'NetID' => "jd111"];
        $response = $this->json('DELETE', 'api/deleteResourcePerProject', $structure);

        $str = "Successfully Deleted Existing ResourcePerProject";
        $response->assertSeeText($str);
    }

    public function test_deleteSchedule()
    {
        $structure = ['ProjectName' => 'P4', 'NetID' => "jd111", 'Dates' => '2019-4-29'];
        $response = $this->json('DELETE', 'api/deleteSchedule', $structure);

        $str = "Successfully Deleted Existing Schedule";
        $response->assertSeeText($str);
    }
}
