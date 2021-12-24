<?php

use yii\db\Migration;

/**
 * Class m211224_125425_create_database_tables
 */
class m211224_125425_create_database_tables extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('footer', [
            'id'             => $this->primaryKey(),
            'email'          => $this->string(45),
            'address'        => $this->string(45),
            'phone'          => $this->string(45)
        ]);

        $this->createTable('info_centro', [
            'id'             => $this->primaryKey(),
            'title'          => $this->string(200),
            'content'        => $this->text(),
            'img_url'        => $this->string(200)
        ]);

        $this->createTable('category', [
            'id'             => $this->primaryKey(),
            'name'           => $this->string(45)->notNull(),
        ]);

        $this->createTable('contest', [
            'id'              => $this->primaryKey(),
            'name'            => $this->string(45)->notNull(),
            'description'     => $this->string(200),
            'start_date'      => $this->datetime(),
            'end_date'        => $this->datetime(),
            'max_img_section' => $this->integer()->defaultExpression(3),
            'img_url'         => $this->string(200),
            'rules_url'       => $this->string(45),
        ]);

        $this->createTable('contest_category', [
            'id'              => $this->primaryKey(),
            'contest_id'      => $this->integer()->notNull(),
            'category_id'     => $this->integer()->notNull(),
        ]);
        $this->createIndex('fk_contest_category_id', 'contest_category', 'category_id');
        $this->createIndex('fk_contest_contest_id', 'contest_category', 'contest_id');
    
        $this->createTable('contest_result', [
            'id'             => $this->primaryKey(),
            'metric_id'      => $this->integer()->notNull(),
            'image_id'       => $this->integer()->notNull(),
            'contest_id'     => $this->integer()->notNull(),
            'section_id'     => $this->integer()->notNull(),
        ]);
        $this->createIndex('fk_contest_result_metric_id', 'contest_result', 'metric_id');
        $this->createIndex('fk_contest_result_contest_id', 'contest_result', 'contest_id');
        $this->createIndex('fk_contest_result_image_id', 'contest_result', 'image_id');
        
        $this->createTable('contest_section', [
            'id'             => $this->primaryKey(),
            'contest_id'     => $this->integer()->notNull(),
            'section_id'     => $this->integer()->notNull(),
        ]);
        $this->createIndex('fk_contest_section_id', 'contest_section', 'section_id');
        $this->createIndex('fk_contest_contest2_id', 'contest_section', 'contest_id');

        $this->createTable('fotoclub', [
            'id'       => $this->primaryKey(),
            'name'     => $this->string(45)->notNull(),
        ]);

        $this->createTable('image', [
            'id'          => $this->primaryKey(),
            'code'        => $this->string(20)->notNull(),
            'title'       => $this->string(45)->notNull(),
            'profile_id'  => $this->integer(45)->notNull(),
            'url'         => $this->string(200)->notNull(),
        ]);

        $this->createTable('metric', [
            'id'          => $this->primaryKey(),
            'prize'       => $this->string(10)->notNull(),
            'score'       => $this->integer(),
        ]);

        $this->createTable('metric_abm', [
            'id'          => $this->primaryKey(),
            'prize'       => $this->string(10)->notNull(),
            'score'       => $this->integer(),
        ]);

        $this->createTable('profile', [
            'id'           => $this->primaryKey(),
            'name'         => $this->string(59),
            'last_name'    => $this->string(50),
            'fotoclub_id'  => $this->integer(),
            'img_url'      => $this->string(200),
        ]);
        $this->createIndex('fk_profile_fotoclub_id', 'profile', 'fotoclub_id');

        $this->createTable('profile_contest', [
            'id'            => $this->primaryKey(),
            'profile_id'    => $this->integer()->notNull(),
            'contest_id'    => $this->integer()->notNull(),
            'category_id'   => $this->integer(),
        ]);
        $this->addForeignKey(
            'profile_enrolled',
            'profile_contest',
            'profile_id',
            'profile',
            'id'
        );
        $this->createIndex('fk_profile_contest_id', 'profile_contest', 'contest_id');
        $this->createIndex('fk_profile_profile_id', 'profile_contest', 'profile_id');
        
        $this->createTable('role', [
            'id'            => $this->primaryKey(),
            'type'          => $this->string(45)->notNull(),
        ]);

        $this->createTable('section', [
            'id'            => $this->primaryKey(),
            'name'          => $this->string(45)->notNull(),
        ]);

        $this->createTable('user', [
            'id'                     => $this->primaryKey(),
            'username'               => $this->string(45),
            'password_hash'          => $this->string(255),
            'password_reset_token'   => $this->string(255),
            'access_token'           => $this->string(128),
            'created_at'             => $this->string(45),
            'updated_at'             => $this->string(45),
            'status'                 => $this->integer(1)->notNull(),
            'role_id'                => $this->integer()->notNull(),
            'profile_id'             => $this->integer()->notNull(),
        ]);
        $this->createIndex('fk_user_role_id', 'user', 'role_id');
        $this->addForeignKey(
            'fk_user_profile_id',
            'user',
            'profile_id',
            'profile',
            'id'
        );

        $this->createTable('thumbnail', [
            'id'                => $this->primaryKey(),
            'image_id'          => $this->integer()->notNull(),
            'thumbnail_type'    => $this->integer()->notNull(),
            'url'               => $this->string(200),
        ]);

        $this->createTable('thumbnail_type', [
            'id'        => $this->primaryKey(),
            'width'     => $this->integer()->notNull(),
            'height'    => $this->integer()->notNull(),
        ]);

        $this->addForeignKey(
            'contest_result_section', 
            'contest_result','section_id', 
            'section','id'
        );

        $this->addForeignKey(
            'fk_contest_category_id',
            'contest_category','category_id',
            'category','id'
        );

        $this->addForeignKey(
            'fk_contest_contest2_id',
            'contest_section','contest_id',
            'contest','id'
        );

        $this->addForeignKey(
            'fk_contest_contest_id',
            'contest_category','contest_id',
            'contest','id'
        );

        $this->addForeignKey(
            'fk_contest_result_contest_id',
            'contest_result','contest_id',
            'contest','id'
        );

        $this->addForeignKey(
            'fk_contest_result_image_id',
            'contest_result','image_id',
            'image','id'
        );

        $this->addForeignKey(
            'fk_contest_result_metric_id',
            'contest_result','metric_id',
            'metric','id'
        );

        $this->addForeignKey(
            'fk_contest_section_id',
            'contest_section','section_id',
            'section','id'
        );

        $this->addForeignKey(
            'fk_profile_contest_id',
            'profile_contest','contest_id',
            'contest','id'
        );

        $this->addForeignKey(
            'fk_profile_fotoclub_id',
            'profile','fotoclub_id',
            'fotoclub','id'
        );

        $this->addForeignKey(
            'fk_profile_profile_id',
            'profile_contest','profile_id',
            'profile','id'
        );

        $this->addForeignKey(
            'fk_user_role_id',
            'user','role_id',
            'role','id'
        );

        $this->addForeignKey(
            'profile_contest_category',
            'profile_contest','category_id',
            'category','id'
        );


    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m211224_125425_create_database_tables cannot be reverted.\n";

        return false;
    }

}
