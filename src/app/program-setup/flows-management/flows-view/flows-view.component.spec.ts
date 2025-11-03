import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { FlowsViewComponent } from './flows-view.component';

describe('FlowsViewComponent', () => {
  let component: FlowsViewComponent;
  let fixture: ComponentFixture<FlowsViewComponent>;
  CommonTestingModule.setUpTestBed(FlowsViewComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlowsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
