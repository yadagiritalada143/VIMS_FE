import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { FlowsListComponent } from './flows-list.component';

describe('FlowsListComponent', () => {
  let component: FlowsListComponent;
  let fixture: ComponentFixture<FlowsListComponent>;
  CommonTestingModule.setUpTestBed(FlowsListComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlowsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
