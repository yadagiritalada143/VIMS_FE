import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { MultiWorkflowComponent } from './multi-workflow.component';

describe('MultiWorkflowComponent', () => {
  let component: MultiWorkflowComponent;
  let fixture: ComponentFixture<MultiWorkflowComponent>;
  CommonTestingModule.setUpTestBed(MultiWorkflowComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiWorkflowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
