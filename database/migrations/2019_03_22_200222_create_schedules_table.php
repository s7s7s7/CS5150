<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSchedulesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::dropIfExists('schedules');

        Schema::create('schedules', function (Blueprint $table) {
            $table->bigInteger('ScheduleID')->unsigned();
            $table->date("Dates");
            $table->integer("HoursPerWeek")->unsigned();
            $table->string("Comment");
        });

        DB::unprepared('ALTER TABLE `schedules` ADD PRIMARY KEY(`ScheduleID`, `Dates`)');

        Schema::enableForeignKeyConstraints();

        Schema::table('schedules', function (Blueprint $table) {
            $table->foreign('ScheduleID')->references('ScheduleID')->on('resources_per_projects');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('schedules');
    }
}
