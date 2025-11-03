import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreateTreeNodeComponent } from './create-tree-node.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateTreeNodeComponent', () => {
  let component: CreateTreeNodeComponent;
  let fixture: ComponentFixture<CreateTreeNodeComponent>;
  CommonTestingModule.setUpTestBed(CreateTreeNodeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
