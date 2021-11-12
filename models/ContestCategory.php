<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "contest_category".
 *
 * @property int $contest_id
 * @property int $category_id
 *
 * @property Category $category
 * @property Contest $contest
 */
class ContestCategory extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest_category';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['contest_id', 'category_id'], 'required'],
            [['contest_id', 'category_id'], 'integer'],
            [['category_id'], 'exist', 'skipOnError' => true, 'targetClass' => Category::className(), 'targetAttribute' => ['category_id' => 'id']],
            [['contest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Contest::className(), 'targetAttribute' => ['contest_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'contest_id' => 'Contest ID',
            'category_id' => 'Category ID',
        ];
    }

    /**
     * Gets query for [[Category]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getCategory()
    {
        return $this->hasOne(Category::className(), ['id' => 'category_id']);
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

    public function fields() {
        $fields = parent::fields();

        
        // unset(  $fields['image_id'],
        //         $fields['metric_id']
        //      );
        // $fields[] = 'category'; 

        return $fields;
    }
    public function extraFields() {
        return [ 'category' ];
    }
}
