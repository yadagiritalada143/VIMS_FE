import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RowRendererComponent } from '../row-renderer/row-renderer.component';
import { ColRendererComponent } from './col-renderer.component';

describe('ColRendererComponent', () => {
  let component: ColRendererComponent;
  let fixture: ComponentFixture<ColRendererComponent>;
  CommonTestingModule.setUpTestBed(ColRendererComponent);
  beforeEach(async(() => {
    const eventServiceSpyObj = jasmine.createSpyObj('ColRendererComponent',['rowIndex']);
    TestBed.configureTestingModule({
      declarations: [ ColRendererComponent,RowRendererComponent ],
      providers:[
        {provide: RowRendererComponent,useValue: eventServiceSpyObj}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
