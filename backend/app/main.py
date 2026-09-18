from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import os
app=FastAPI(title='Esophageal Screening MVP')
cors_origins = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://172.20.10.2:5173').split(',') if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=['*'], allow_headers=['*'])
class Assessment(BaseModel):
 age:str; smoking:str; alcohol:str; family:str; symptoms:str
@app.get('/api/health')
def health(): return {'status':'ok','service':'esophageal-screening'}
@app.get('/api/questionnaire')
def questionnaire(): return {'version':'0.1-demo','disclaimer':'研究/演示原型，不用于临床诊断'}
@app.post('/api/assessment')
def assessment(data:Assessment):
 score=0; factors=[]
 rules=[('age','60岁及以上',20,'年龄因素'),('smoking','目前吸烟',20,'吸烟相关因素'),('alcohol','经常饮酒',15,'饮酒相关因素'),('family','有',25,'家族史因素'),('symptoms','有多项或持续加重',20,'症状因素')]
 for field,value,points,label in rules:
  if getattr(data,field)==value: score+=points; factors.append(label)
 level='低风险' if score<25 else ('中风险' if score<50 else '较高风险')
 rec=['保持均衡饮食，避免过烫食物，维持健康生活方式。']
 if data.symptoms!='没有': rec.append('如症状持续、明显或进行性加重，建议尽快咨询专业医疗人员。')
 else: rec.append('可结合个人情况向专业医疗人员了解适宜的筛查建议。')
 return {'risk_level':level,'risk_score':score,'factors':factors,'recommendations':rec,'disclaimer':'研究/演示原型，不用于临床诊断。'}
