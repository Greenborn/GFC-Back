<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "contest_section".
 *
 * @property int $contest_id
 * @property int $section_id
 *
 * @property Contest $contest
 * @property Section $section
 */
class ContestSection extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest_section';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['contest_id', 'section_id'], 'required'],
            [['contest_id', 'section_id'], 'integer'],
            [['contest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Contest::className(), 'targetAttribute' => ['contest_id' => 'id']],
            [['section_id'], 'exist', 'skipOnError' => true, 'targetClass' => Section::className(), 'targetAttribute' => ['section_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'contest_id' => 'Contest ID',
            'section_id' => 'Section ID',
        ];
    }

    /**
     * Gets query for [[Contest]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContest()
    {
        return $this->hasOne(Contest::className(), ['id' => 'contest_id']);
    }

    /**
     * Gets query for [[Section]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getSection()
    {
        return $this->hasOne(Section::className(), ['id' => 'section_id']);
    }

    public function fields() {
        $fields = parent::fields();

        
        // expand por default
        // unset(  $fields['image_id'],
        //         $fields['metric_id']
        //      );
        // $fields[] = 'section'; 

        return $fields;
    }

    public function extraFields() {
        return [ 'section' ];
    }
}
